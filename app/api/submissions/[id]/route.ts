import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'
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

// GET /api/submissions/[id] - Get single submission
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const permKey = modulePermissionMap[submission.formTemplate.moduleType]
    const permissions = await getUserPermissions(session.user.id)

    if (!permissions[permKey]?.access) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check viewAll vs viewOwn
    if (!permissions[permKey]?.viewAll && submission.submittedById !== session.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/submissions/[id] - Update submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const permKey = modulePermissionMap[submission.formTemplate.moduleType]

    // Only allow edit if user has edit permission and is owner, or has viewAll
    const canEdit = await canUserAccess(session.user.id, permKey, 'edit')
    const permissions = await getUserPermissions(session.user.id)
    const isOwner = submission.submittedById === session.user.id

    if (!canEdit || (!permissions[permKey]?.viewAll && !isOwner)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Don't allow editing approved submissions
    if (submission.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot edit approved submission' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { data, outsideTemp, outsideTempUnit } = body

    const previousData = submission.data

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        data,
        outsideTemp,
        outsideTempUnit,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
        previousValue: previousData as any,
        newValue: data as any,
      },
    })

    return NextResponse.json({ submission: updated })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/submissions/[id] - Archive submission (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const permKey = modulePermissionMap[submission.formTemplate.moduleType]
    const canDelete = await canUserAccess(session.user.id, permKey, 'delete')

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Soft delete (archive)
    await prisma.submission.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ARCHIVE',
        entityType: 'Submission',
        entityId: id,
        submissionId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
