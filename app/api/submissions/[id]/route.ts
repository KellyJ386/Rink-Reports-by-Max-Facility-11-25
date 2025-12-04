import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  validateBody,
} from '@/lib/api-utils'
import { UpdateSubmissionSchema, ReviewSubmissionSchema } from '@/lib/validations'
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

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/submissions/[id] - Get single submission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
            schema: true,
          },
        },
        rink: {
          select: {
            id: true,
            name: true,
            facilityId: true,
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
        attachments: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!submission) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Submission not found')
    }

    // Check facility access
    if (submission.rink.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Check view permissions
    const permissionKey = moduleTypeToPermission[submission.formTemplate.moduleType]
    const canViewAll = permissionKey && canUserAccess(user, permissionKey, 'viewAll')
    const canViewOwn = permissionKey && canUserAccess(user, permissionKey, 'viewOwn')

    if (!canViewAll && (!canViewOwn || submission.submittedById !== user.id)) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to view this submission')
    }

    return successResponse(submission)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/submissions/[id] - Update submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params
    const body = await request.json()
    const data = validateBody(UpdateSubmissionSchema, body)

    // Get existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            moduleType: true,
          },
        },
        rink: {
          select: {
            facilityId: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Submission not found')
    }

    // Check facility access
    if (existing.rink.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Check edit permissions
    const permissionKey = moduleTypeToPermission[existing.formTemplate.moduleType]
    const canEdit = permissionKey && canUserAccess(user, permissionKey, 'edit')
    const isOwner = existing.submittedById === user.id

    // Only owner can edit drafts, or users with edit permission
    if (!canEdit && !(isOwner && existing.status === 'DRAFT')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to edit this submission')
    }

    // Cannot edit approved/rejected submissions unless admin
    if (['APPROVED', 'REJECTED'].includes(existing.status) && !canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Cannot edit finalized submissions')
    }

    const previousValue = {
      data: existing.data,
      status: existing.status,
      outsideTemp: existing.outsideTemp,
    }

    // Update submission
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        ...(data.data && { data: data.data }),
        ...(data.status && { status: data.status }),
        ...(data.outsideTemp !== undefined && { outsideTemp: data.outsideTemp }),
        ...(data.outsideTempUnit && { outsideTempUnit: data.outsideTempUnit }),
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
        action: 'UPDATE',
        entityType: 'Submission',
        entityId: id,
        previousValue,
        newValue: { data: data.data, status: data.status },
        submissionId: id,
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/submissions/[id] - Soft delete (archive) submission
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Get existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            moduleType: true,
          },
        },
        rink: {
          select: {
            facilityId: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Submission not found')
    }

    // Check facility access
    if (existing.rink.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Check delete permissions
    const permissionKey = moduleTypeToPermission[existing.formTemplate.moduleType]
    const canDelete = permissionKey && canUserAccess(user, permissionKey, 'delete')

    if (!canDelete) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to delete this submission')
    }

    // Soft delete (archive)
    await prisma.submission.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ARCHIVE',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
      },
    })

    return successResponse({ message: 'Submission archived successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/submissions/[id] - Review submission (approve/reject)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params
    const body = await request.json()
    const data = validateBody(ReviewSubmissionSchema, body)

    // Get existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            moduleType: true,
          },
        },
        rink: {
          select: {
            facilityId: true,
          },
        },
      },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Submission not found')
    }

    // Check facility access
    if (existing.rink.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Check approve permissions
    const permissionKey = moduleTypeToPermission[existing.formTemplate.moduleType]
    const canApprove = permissionKey && canUserAccess(user, permissionKey, 'approve')

    if (!canApprove) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to review this submission')
    }

    // Can only review submissions in SUBMITTED or PENDING_REVIEW status
    if (!['SUBMITTED', 'PENDING_REVIEW'].includes(existing.status)) {
      return errorResponse(ErrorCodes.INVALID_INPUT, 'Submission is not pending review')
    }

    const previousStatus = existing.status

    // Update submission
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: data.reviewNotes,
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
        action: data.status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        entityType: 'Submission',
        entityId: id,
        previousValue: { status: previousStatus },
        newValue: { status: data.status, reviewNotes: data.reviewNotes },
        submissionId: id,
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
