import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { ModuleType } from '@/types'

const moduleTypeMap: Record<string, ModuleType> = {
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

/**
 * GET /api/submissions/[id]
 * Get a single submission
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        rink: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
        rink: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attachments: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check permission
    const permModule = moduleTypeMap[submission.formTemplate.moduleType]
    const permissions = getUserPermissions(user)

    if (permModule) {
      const canView =
        permissions[permModule]?.viewAll ||
        (permissions[permModule]?.viewOwn && submission.submittedById === user.id)

      if (!canView) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/submissions/[id]
 * Update a submission (edit data, approve/reject)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.submission.findFirst({
      where: {
        id,
        rink: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const body = await request.json()
    const { data, status, reviewNotes } = body

    const permModule = moduleTypeMap[existing.formTemplate.moduleType]
    const permissions = getUserPermissions(user)

    // Determine what action is being taken
    const isEditing = data !== undefined
    const isReviewing = status === 'APPROVED' || status === 'REJECTED'

    // Check permissions
    if (isEditing) {
      const canEdit =
        permissions[permModule]?.edit ||
        (existing.submittedById === user.id && existing.status === 'DRAFT')

      if (!canEdit) {
        return NextResponse.json({ error: 'Cannot edit submission' }, { status: 403 })
      }
    }

    if (isReviewing) {
      if (!permissions[permModule]?.approve) {
        return NextResponse.json({ error: 'Cannot approve/reject submission' }, { status: 403 })
      }
    }

    const previousValue = {
      data: existing.data,
      status: existing.status,
    }

    // Update submission
    const updateData: any = {}

    if (data !== undefined) {
      updateData.data = data
    }

    if (status) {
      updateData.status = status

      if (isReviewing) {
        updateData.reviewedById = user.id
        updateData.reviewedAt = new Date()
        updateData.reviewNotes = reviewNotes || null
      }
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
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
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isReviewing ? (status === 'APPROVED' ? 'APPROVE' : 'REJECT') : 'UPDATE',
        entityType: 'Submission',
        entityId: submission.id,
        submissionId: submission.id,
        previousValue,
        newValue: { data: submission.data, status: submission.status },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/submissions/[id]
 * Archive a submission (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.submission.findFirst({
      where: {
        id,
        rink: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check permission
    const permModule = moduleTypeMap[existing.formTemplate.moduleType]
    const permissions = getUserPermissions(user)

    if (!permissions[permModule]?.delete) {
      return NextResponse.json({ error: 'Cannot delete submission' }, { status: 403 })
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
        previousValue: { archivedAt: null },
        newValue: { archivedAt: new Date() },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
