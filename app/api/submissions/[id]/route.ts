import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import type { ModuleType } from '@/types'

export const dynamic = 'force-dynamic'

// Map module types to permission keys
const MODULE_TO_PERMISSION: Record<string, ModuleType> = {
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

// GET - Get single submission
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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
            facilityId: true,
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
        attachments: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check facility access
    if (submission.formTemplate.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check permission
    const permissionKey = MODULE_TO_PERMISSION[submission.formTemplate.moduleType]
    const canViewAll = permissionKey
      ? canUserAccess(user, permissionKey, 'viewAll')
      : false
    const isOwner = submission.submittedById === user.id

    if (!canViewAll && !isOwner) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT - Update submission
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { data, status, reviewNotes, outsideTemp, outsideTempUnit } = body

    // Fetch existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            moduleType: true,
            facilityId: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (existing.formTemplate.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const permissionKey = MODULE_TO_PERMISSION[existing.formTemplate.moduleType]
    const isOwner = existing.submittedById === user.id
    const canEdit = permissionKey
      ? canUserAccess(user, permissionKey, 'edit')
      : false
    const canApprove = permissionKey
      ? canUserAccess(user, permissionKey, 'approve')
      : false

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Data update (only owner can update data, and only if draft)
    if (data !== undefined) {
      if (!isOwner && !canEdit) {
        return NextResponse.json({ error: 'Cannot edit this submission' }, { status: 403 })
      }
      if (existing.status !== 'DRAFT' && !canEdit) {
        return NextResponse.json({ error: 'Cannot edit submitted entries' }, { status: 400 })
      }
      updateData.data = data
    }

    // Outside temp update
    if (outsideTemp !== undefined) {
      updateData.outsideTemp = outsideTemp
    }
    if (outsideTempUnit) {
      updateData.outsideTempUnit = outsideTempUnit
    }

    // Status update
    if (status !== undefined) {
      // Approval actions require approve permission
      if (['APPROVED', 'REJECTED'].includes(status)) {
        if (!canApprove) {
          return NextResponse.json({ error: 'Cannot approve/reject submissions' }, { status: 403 })
        }
        updateData.status = status
        updateData.reviewedById = user.id
        updateData.reviewedAt = new Date()
        if (reviewNotes) {
          updateData.reviewNotes = reviewNotes
        }
      } else if (status === 'SUBMITTED' && existing.status === 'DRAFT') {
        // Submitting a draft (owner only)
        if (!isOwner) {
          return NextResponse.json({ error: 'Only owner can submit draft' }, { status: 403 })
        }
        updateData.status = status
        updateData.submittedAt = new Date()
      } else if (status === 'DRAFT' && isOwner) {
        updateData.status = status
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
      include: {
        formTemplate: {
          select: {
            name: true,
            moduleType: true,
          },
        },
        rink: {
          select: {
            name: true,
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
        entityId: submission.id,
        previousValue: { status: existing.status },
        newValue: updateData,
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Archive submission (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        formTemplate: {
          select: {
            moduleType: true,
            facilityId: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (existing.formTemplate.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const permissionKey = MODULE_TO_PERMISSION[existing.formTemplate.moduleType]
    const isOwner = existing.submittedById === user.id
    const canDelete = permissionKey
      ? canUserAccess(user, permissionKey, 'delete')
      : false

    // Only owner can delete drafts, or users with delete permission
    if (!canDelete && !(isOwner && existing.status === 'DRAFT')) {
      return NextResponse.json({ error: 'Cannot delete this submission' }, { status: 403 })
    }

    // Soft delete
    await prisma.submission.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'Submission',
        entityId: id,
        previousValue: { status: existing.status },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
