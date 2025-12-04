import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  parsePagination,
  createPaginatedResponse,
  parseSortParams,
  parseDateRange,
  validateBody,
} from '@/lib/api-utils'
import { CreateSubmissionSchema } from '@/lib/validations'
import type { ModuleType } from '@/types'

// Map database module types to permission keys
const moduleTypeToPermission: Record<string, ModuleType> = {
  ICE_DEPTH: 'iceDepth',
  ICE_OPERATIONS: 'iceOperations',
  REFRIGERATION: 'refrigeration',
  AIR_QUALITY: 'airQuality',
  INCIDENT: 'incidents',
  SCHEDULE: 'schedule',
  DAILY_CHECKLIST: 'dailyChecklist',
}

// GET /api/submissions - List submissions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const sort = parseSortParams(
      searchParams,
      ['submittedAt', 'status', 'updatedAt'],
      'submittedAt'
    )
    const dateRange = parseDateRange(searchParams)

    // Build where clause
    const where: Record<string, unknown> = {
      archivedAt: null, // Exclude archived
    }

    // Filter by module type
    const moduleType = searchParams.get('moduleType')
    if (moduleType) {
      where.formTemplate = { moduleType }
    }

    // Filter by rink
    const rinkId = searchParams.get('rinkId')
    if (rinkId) {
      where.rinkId = rinkId
    }

    // Filter by status
    const status = searchParams.get('status')
    if (status) {
      where.status = status
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      where.submittedAt = {}
      if (dateRange.from) {
        (where.submittedAt as Record<string, Date>).gte = dateRange.from
      }
      if (dateRange.to) {
        (where.submittedAt as Record<string, Date>).lte = dateRange.to
      }
    }

    // Check if user can view all or only their own
    // Get the module type to check permissions
    let canViewAll = false
    if (moduleType) {
      const permissionKey = moduleTypeToPermission[moduleType]
      if (permissionKey) {
        canViewAll = canUserAccess(user, permissionKey, 'viewAll')
      }
    }

    // If not viewing all, restrict to user's submissions
    if (!canViewAll) {
      where.submittedById = user.id
    }

    // Restrict to user's facility
    where.rink = {
      facilityId: user.facilityId,
    }

    // Get total count
    const total = await prisma.submission.count({ where })

    // Get submissions
    const submissions = await prisma.submission.findMany({
      where,
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
          },
        },
        rink: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: {
        [sort.field]: sort.direction,
      },
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(submissions, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/submissions - Create submission
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const body = await request.json()
    const data = validateBody(CreateSubmissionSchema, body)

    // Get the form template to check permissions
    const formTemplate = await prisma.formTemplate.findUnique({
      where: { id: data.formTemplateId },
      select: {
        id: true,
        moduleType: true,
        version: true,
        facilityId: true,
        isActive: true,
      },
    })

    if (!formTemplate) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Form template not found')
    }

    if (!formTemplate.isActive) {
      return errorResponse(ErrorCodes.INVALID_INPUT, 'Form template is no longer active')
    }

    // Check if template belongs to user's facility
    if (formTemplate.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Form template not accessible')
    }

    // Check if user has submit permission for this module
    const permissionKey = moduleTypeToPermission[formTemplate.moduleType]
    if (!permissionKey || !canUserAccess(user, permissionKey, 'submit')) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        `You don't have permission to submit ${formTemplate.moduleType} reports`
      )
    }

    // Verify rink belongs to user's facility
    const rink = await prisma.rink.findUnique({
      where: { id: data.rinkId },
      select: { facilityId: true },
    })

    if (!rink || rink.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Rink not found')
    }

    // Check for duplicate submission (offline sync deduplication)
    if (data.clientId) {
      const existing = await prisma.submission.findFirst({
        where: { clientId: data.clientId },
      })
      if (existing) {
        return successResponse(existing, 200) // Return existing instead of error
      }
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formTemplateId: data.formTemplateId,
        formVersionAtSubmission: formTemplate.version,
        rinkId: data.rinkId,
        submittedById: user.id,
        outsideTemp: data.outsideTemp,
        outsideTempUnit: data.outsideTempUnit,
        data: data.data,
        status: data.status,
        clientId: data.clientId,
        syncedAt: data.clientId ? new Date() : null,
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
          },
        },
        rink: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        newValue: { moduleType: formTemplate.moduleType, status: submission.status },
        submissionId: submission.id,
      },
    })

    return successResponse(submission, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
