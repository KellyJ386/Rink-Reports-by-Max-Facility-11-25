import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'
import { ModuleType } from '@/types'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/submissions/[id] - Get a single submission
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
        formTemplate: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
        rink: true,
        submittedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        attachments: true,
        auditLogs: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check view permissions
    const moduleKey = submission.formTemplate.moduleType.toLowerCase().replace('_', '') as ModuleType
    const permissions = getUserPermissions(user)
    const modulePermissions = permissions[moduleKey]

    if (!modulePermissions?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!modulePermissions.viewAll && submission.submittedById !== user.id) {
      return NextResponse.json({ error: 'You can only view your own submissions' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

// PUT /api/submissions/[id] - Update a submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        formTemplate: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const moduleKey = submission.formTemplate.moduleType.toLowerCase().replace('_', '') as ModuleType

    // Check edit permissions
    if (!canUserAccess(user, moduleKey, 'edit') && submission.submittedById !== user.id) {
      return NextResponse.json({ error: 'No permission to edit this submission' }, { status: 403 })
    }

    // Only allow editing draft or own submissions
    if (submission.status !== 'DRAFT' && submission.submittedById !== user.id) {
      if (!canUserAccess(user, moduleKey, 'edit')) {
        return NextResponse.json({ error: 'Cannot edit submitted reports' }, { status: 403 })
      }
    }

    const { data, outsideTemp, outsideTempUnit, status } = body

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }
    }

    // Validate outsideTempUnit if provided
    if (outsideTempUnit !== undefined) {
      const validUnits = ['F', 'C']
      if (!validUnits.includes(outsideTempUnit)) {
        return NextResponse.json({ error: 'Invalid temperature unit. Use F or C.' }, { status: 400 })
      }
    }

    const previousData = submission.data

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        ...(data && { data }),
        ...(outsideTemp !== undefined && { outsideTemp }),
        ...(outsideTempUnit && { outsideTempUnit }),
        ...(status && { status }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
        previousValue: previousData as object,
        newValue: data as object,
      },
    })

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

// DELETE /api/submissions/[id] - Archive a submission
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        formTemplate: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const moduleKey = submission.formTemplate.moduleType.toLowerCase().replace('_', '') as ModuleType

    if (!canUserAccess(user, moduleKey, 'delete')) {
      return NextResponse.json({ error: 'No permission to delete submissions' }, { status: 403 })
    }

    // Soft delete
    await prisma.submission.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ARCHIVE',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}

// PATCH /api/submissions/[id] - Approve/Reject submission (special action)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, reviewNotes } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        formTemplate: { facilityId: user.facilityId },
      },
      include: {
        formTemplate: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const moduleKey = submission.formTemplate.moduleType.toLowerCase().replace('_', '') as ModuleType

    if (!canUserAccess(user, moduleKey, 'approve')) {
      return NextResponse.json({ error: 'No permission to approve/reject submissions' }, { status: 403 })
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
        newValue: { status: newStatus, reviewNotes },
      },
    })

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error) {
    console.error('Error reviewing submission:', error)
    return NextResponse.json({ error: 'Failed to review submission' }, { status: 500 })
  }
}
