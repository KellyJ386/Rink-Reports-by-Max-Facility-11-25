import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  parsePagination,
  createPaginatedResponse,
  parseSortParams,
  parseDateRange,
} from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema for starting a checklist instance
const StartChecklistSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  scheduledFor: z.string().datetime().optional(),
  dueBy: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
})

// GET /api/checklists - List checklist instances
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
      ['createdAt', 'scheduledFor', 'completedAt', 'status'],
      'createdAt'
    )
    const dateRange = parseDateRange(searchParams)

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by status
    const status = searchParams.get('status')
    if (status) {
      where.status = status
    }

    // Filter by template
    const templateId = searchParams.get('templateId')
    if (templateId) {
      where.templateId = templateId
    }

    // Filter by assigned user
    const assignedToId = searchParams.get('assignedToId')
    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      where.createdAt = {}
      if (dateRange.from) {
        (where.createdAt as Record<string, Date>).gte = dateRange.from
      }
      if (dateRange.to) {
        (where.createdAt as Record<string, Date>).lte = dateRange.to
      }
    }

    // Get total count
    const total = await prisma.checklistInstance.count({ where })

    // Get checklist instances
    const instances = await prisma.checklistInstance.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDuration: true,
          },
        },
      },
      orderBy: {
        [sort.field]: sort.direction,
      },
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(instances, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/checklists - Start a new checklist instance
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const body = await request.json()
    const data = StartChecklistSchema.parse(body)

    // Verify template exists and belongs to user's facility
    const template = await prisma.checklistTemplate.findFirst({
      where: {
        id: data.templateId,
        facilityId: user.facilityId,
        isActive: true,
      },
    })

    if (!template) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Checklist template not found')
    }

    // Initialize sections from template
    const sections = template.sections as Array<{
      id: string
      title: string
      items: Array<{ id: string; label: string; isRequired: boolean }>
    }>

    const initializedSections = sections.map((section) => ({
      sectionId: section.id,
      title: section.title,
      items: section.items.map((item) => ({
        itemId: item.id,
        label: item.label,
        value: null,
        status: 'pending',
        completedAt: null,
        completedBy: null,
        notes: null,
      })),
    }))

    const instance = await prisma.checklistInstance.create({
      data: {
        templateId: data.templateId,
        facilityId: user.facilityId,
        status: 'IN_PROGRESS',
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        dueBy: data.dueBy ? new Date(data.dueBy) : null,
        assignedToId: data.assignedToId || user.id,
        startedAt: new Date(),
        sections: initializedSections,
        completionPercentage: 0,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDuration: true,
          },
        },
      },
    })

    return successResponse(instance, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors)
    }
    return handleApiError(error)
  }
}
