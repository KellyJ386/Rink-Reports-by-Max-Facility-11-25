import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/submissions/[id]/review - Approve or reject a submission
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { formTemplate: true },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check approve permission
    const moduleTypeMap: Record<string, string> = {
      ICE_DEPTH: 'iceDepth',
      ICE_OPERATIONS: 'iceOperations',
      REFRIGERATION: 'refrigeration',
      AIR_QUALITY: 'airQuality',
      INCIDENT: 'incidents',
      SCHEDULE: 'schedule',
      DAILY_CHECKLIST: 'dailyChecklist',
    }

    const permissionModule = moduleTypeMap[submission.formTemplate.moduleType]
    if (!canUserAccess(user, permissionModule as any, 'approve')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only submitted reports can be reviewed
    if (submission.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Only submitted reports can be reviewed' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action, notes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
          },
        },
        user: {
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
        facilityId: user.facilityId,
        userId: user.id,
        action: action === 'approve' ? 'APPROVE_SUBMISSION' : 'REJECT_SUBMISSION',
        entityType: 'Submission',
        entityId: id,
        details: {
          formTemplateName: submission.formTemplate.name,
          notes: notes || null,
        },
      },
    })

    // Create notification for the submitter
    await prisma.notification.create({
      data: {
        facilityId: user.facilityId,
        userId: submission.userId,
        type: action === 'approve' ? 'APPROVAL' : 'REJECTION',
        title: `Report ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: `Your ${submission.formTemplate.name} submission has been ${action === 'approve' ? 'approved' : 'rejected'}${notes ? `: ${notes}` : ''}.`,
        entityType: 'Submission',
        entityId: id,
      },
    })

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error) {
    console.error('Error reviewing submission:', error)
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    )
  }
}
