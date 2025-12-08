import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { reviewTimeOffRequestSchema } from '@/types/schedule'
import { TimeOffStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/schedule/time-off/[id] - Get single request
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { name: true } },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!timeOffRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (timeOffRequest.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check permissions - users can see their own requests
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll && timeOffRequest.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ request: timeOffRequest })
  } catch (error) {
    console.error('Error fetching time-off request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/schedule/time-off/[id] - Review/update request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if this is a review action (by manager)
    if (body.status === 'APPROVED' || body.status === 'DENIED') {
      if (!canUserAccess(user, 'schedule', 'approve')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const result = reviewTimeOffRequestSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors }, { status: 400 })
      }

      const data = result.data

      const updatedRequest = await prisma.timeOffRequest.update({
        where: { id },
        data: {
          status: data.status as TimeOffStatus,
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes || null,
          hoursPaid: data.hoursPaid || null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Notify the employee
      const notificationType = data.status === 'APPROVED' ? 'TIME_OFF_APPROVED' : 'TIME_OFF_DENIED'
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientUserId: existingRequest.userId,
          type: notificationType,
          title: `Time-Off Request ${data.status === 'APPROVED' ? 'Approved' : 'Denied'}`,
          message: `Your time-off request from ${existingRequest.startDate.toLocaleDateString()} to ${existingRequest.endDate.toLocaleDateString()} has been ${data.status.toLowerCase()}.${data.reviewNotes ? ` Note: ${data.reviewNotes}` : ''}`,
          relatedEntityType: 'TimeOffRequest',
          relatedEntityId: id,
        },
      })

      // Create audit log
      const action = data.status === 'APPROVED' ? 'TIME_OFF_APPROVE' : 'TIME_OFF_DENY'
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          entityType: 'TimeOffRequest',
          entityId: id,
          previousValue: existingRequest,
          newValue: updatedRequest,
        },
      })

      return NextResponse.json({ request: updatedRequest })
    }

    // Check if user is cancelling their own request
    if (body.status === 'CANCELLED') {
      if (existingRequest.userId !== user.id && !canUserAccess(user, 'schedule', 'edit')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (existingRequest.status !== TimeOffStatus.PENDING) {
        return NextResponse.json({
          error: 'Can only cancel pending requests',
        }, { status: 400 })
      }

      const updatedRequest = await prisma.timeOffRequest.update({
        where: { id },
        data: {
          status: TimeOffStatus.CANCELLED,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'TimeOffRequest',
          entityId: id,
          previousValue: existingRequest,
          newValue: updatedRequest,
        },
      })

      return NextResponse.json({ request: updatedRequest })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating time-off request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedule/time-off/[id] - Delete request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Only allow deletion of own pending requests or by admins
    if (existingRequest.userId !== user.id) {
      if (!canUserAccess(user, 'schedule', 'delete')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (existingRequest.status !== TimeOffStatus.PENDING) {
      return NextResponse.json({
        error: 'Can only delete pending requests',
      }, { status: 400 })
    }

    await prisma.timeOffRequest.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'TimeOffRequest',
        entityId: id,
        previousValue: existingRequest,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting time-off request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
