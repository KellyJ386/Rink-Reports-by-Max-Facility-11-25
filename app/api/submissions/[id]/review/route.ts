import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { ModuleType } from '@prisma/client'

const modulePermissionMap: Record<ModuleType, string> = {
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

// POST /api/submissions/[id]/review - Approve or reject submission
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        formTemplate: {
          facilityId: session.user.facilityId,
        },
      },
      include: {
        formTemplate: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const permKey = modulePermissionMap[submission.formTemplate.moduleType]
    const canApprove = await canUserAccess(session.user.id, permKey, 'approve')

    if (!canApprove) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { action, notes } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const previousStatus = submission.status

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
        previousValue: { status: previousStatus },
        newValue: { status: newStatus, notes },
      },
    })

    // Create notification for submitter
    await prisma.notification.create({
      data: {
        facilityId: session.user.facilityId,
        recipientUserId: submission.submittedById,
        type: 'SYSTEM',
        title: `Submission ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your ${submission.formTemplate.name} submission has been ${action === 'approve' ? 'approved' : 'rejected'}.${notes ? ` Notes: ${notes}` : ''}`,
        relatedEntityType: 'Submission',
        relatedEntityId: id,
      },
    })

    return NextResponse.json({ submission: updated })
  } catch (error) {
    console.error('Error reviewing submission:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
