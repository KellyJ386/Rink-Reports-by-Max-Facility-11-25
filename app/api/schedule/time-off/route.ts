import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/schedule/time-off - List time-off requests
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    // Build query
    const where: Record<string, unknown> = {}

    // If user can only view own, filter to their requests
    if (!permissions.schedule?.viewAll) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Filter by facility - get users in same facility
    if (permissions.schedule?.viewAll) {
      where.user = {
        facilityId: user.facilityId
      }
    }

    if (status) {
      where.status = status
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { startDate: 'asc' }
      ]
    })

    // Get pending count for badge
    const pendingCount = await prisma.timeOffRequest.count({
      where: {
        ...where,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      requests,
      pendingCount,
      canApprove: permissions.schedule?.edit || false
    })

  } catch (error) {
    console.error('Time-off GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time-off requests' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/time-off - Create new time-off request
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, reason } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for overlapping requests
    const overlapping = await prisma.timeOffRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a time-off request for these dates' },
        { status: 400 }
      )
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: user.id,
        startDate: start,
        endDate: end,
        reason: reason || null,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Create notification for managers
    await prisma.notification.create({
      data: {
        facilityId: user.facilityId,
        recipientRoleId: null, // Broadcast to managers
        type: 'SYSTEM',
        title: 'New Time-Off Request',
        message: `${user.firstName} ${user.lastName} requested time off from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
        relatedEntityType: 'TimeOffRequest',
        relatedEntityId: timeOffRequest.id
      }
    })

    return NextResponse.json(timeOffRequest, { status: 201 })

  } catch (error) {
    console.error('Time-off POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create time-off request' },
      { status: 500 }
    )
  }
}

// PATCH /api/schedule/time-off - Update (approve/deny) a request
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)

    const body = await request.json()
    const { id, status, reviewNotes } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      )
    }

    // Get the request
    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { facilityId: true, firstName: true, lastName: true }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Time-off request not found' },
        { status: 404 }
      )
    }

    // Check permissions - user can cancel own, managers can approve/deny
    const isOwnRequest = existingRequest.userId === user.id
    const canManage = permissions.schedule?.edit

    if (status === 'CANCELLED') {
      if (!isOwnRequest) {
        return NextResponse.json(
          { error: 'You can only cancel your own requests' },
          { status: 403 }
        )
      }
    } else if (status === 'APPROVED' || status === 'DENIED') {
      if (!canManage) {
        return NextResponse.json(
          { error: 'You do not have permission to approve/deny requests' },
          { status: 403 }
        )
      }
    }

    // Verify same facility
    if (existingRequest.user.facilityId !== user.facilityId) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: status !== 'CANCELLED' ? user.id : null,
        reviewedAt: status !== 'CANCELLED' ? new Date() : null,
        reviewNotes: reviewNotes || null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Notify the requester
    if (status === 'APPROVED' || status === 'DENIED') {
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientUserId: existingRequest.userId,
          type: 'SYSTEM',
          title: `Time-Off Request ${status === 'APPROVED' ? 'Approved' : 'Denied'}`,
          message: `Your time-off request for ${existingRequest.startDate.toLocaleDateString()} - ${existingRequest.endDate.toLocaleDateString()} has been ${status.toLowerCase()}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
          relatedEntityType: 'TimeOffRequest',
          relatedEntityId: id
        }
      })
    }

    return NextResponse.json(updatedRequest)

  } catch (error) {
    console.error('Time-off PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update time-off request' },
      { status: 500 }
    )
  }
}
