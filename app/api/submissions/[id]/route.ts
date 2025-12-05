import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/submissions/[id] - Get a specific submission
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rink: true,
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        attachments: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check view permission
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
    const canViewAll = canUserAccess(user, permissionModule as any, 'viewAll')
    const canViewOwn = canUserAccess(user, permissionModule as any, 'viewOwn')

    if (!canViewAll && (!canViewOwn || submission.userId !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

// PUT /api/submissions/[id] - Update a submission
export async function PUT(request: NextRequest, context: RouteContext) {
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

    // Only drafts can be edited by the owner
    if (submission.status !== 'DRAFT' && submission.userId === user.id) {
      return NextResponse.json(
        { error: 'Only drafts can be edited' },
        { status: 400 }
      )
    }

    // Check edit permission
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
    const canEdit = canUserAccess(user, permissionModule as any, 'edit')

    // Owner can edit their own drafts, or user with edit permission
    if (submission.userId !== user.id && !canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { data, status, rinkId } = body

    const updateData: Record<string, unknown> = {}

    if (data !== undefined) {
      updateData.data = data
    }

    if (status !== undefined) {
      updateData.status = status
      if (status === 'SUBMITTED') {
        updateData.submittedAt = new Date()
      }
    }

    if (rinkId !== undefined) {
      updateData.rinkId = rinkId
    }

    const updatedSubmission = await prisma.submission.update({
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
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        facilityId: user.facilityId,
        userId: user.id,
        action: status === 'SUBMITTED' ? 'SUBMIT_REPORT' : 'UPDATE_SUBMISSION',
        entityType: 'Submission',
        entityId: id,
        details: { status: updatedSubmission.status },
      },
    })

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

// DELETE /api/submissions/[id] - Delete a submission
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Check delete permission
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
    const canDelete = canUserAccess(user, permissionModule as any, 'delete')

    // Only drafts can be deleted by owner, or user with delete permission
    if (submission.status !== 'DRAFT' && !canDelete) {
      return NextResponse.json(
        { error: 'Only drafts can be deleted' },
        { status: 400 }
      )
    }

    if (submission.userId !== user.id && !canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.submission.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        facilityId: user.facilityId,
        userId: user.id,
        action: 'DELETE_SUBMISSION',
        entityType: 'Submission',
        entityId: id,
        details: { formTemplateName: submission.formTemplate.name },
      },
    })

    return NextResponse.json({ message: 'Submission deleted successfully' })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
