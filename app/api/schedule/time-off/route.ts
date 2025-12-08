import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { createTimeOffRequestSchema } from '@/types/schedule'
import { TimeOffStatus } from '@prisma/client'

// GET /api/schedule/time-off - Get time-off requests
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as TimeOffStatus | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      facilityId: user.facilityId,
    }

    // Check view permissions
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll) {
      where.userId = user.id // Can only see own requests
    } else if (userId) {
      where.userId = userId
    }

    if (status) where.status = status

    if (startDate) {
      where.endDate = { gte: new Date(startDate) }
    }

    if (endDate) {
      where.startDate = { lte: new Date(endDate) }
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      orderBy: [{ status: 'asc' }, { startDate: 'asc' }],
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching time-off requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule/time-off - Create time-off request
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const result = createTimeOffRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (startDate > endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Check for overlapping requests
    const existingRequests = await prisma.timeOffRequest.findMany({
      where: {
        userId: user.id,
        status: { not: TimeOffStatus.CANCELLED },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    if (existingRequests.length > 0) {
      return NextResponse.json({
        error: 'You already have a time-off request for this period',
      }, { status: 400 })
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: user.id,
        facilityId: user.facilityId,
        startDate,
        endDate,
        requestType: data.requestType,
        reason: data.reason || null,
        hoursRequested: data.hoursRequested || null,
        status: TimeOffStatus.PENDING,
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

    // Create notification for managers
    const managerRoles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: 'Manager' } },
          { name: { contains: 'Supervisor' } },
        ],
      },
    })

    for (const role of managerRoles) {
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientRoleId: role.id,
          type: 'TIME_OFF_REQUESTED',
          title: 'New Time-Off Request',
          message: `${user.firstName} ${user.lastName} has requested time off from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
          relatedEntityType: 'TimeOffRequest',
          relatedEntityId: timeOffRequest.id,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TIME_OFF_REQUEST',
        entityType: 'TimeOffRequest',
        entityId: timeOffRequest.id,
        newValue: timeOffRequest,
      },
    })

    return NextResponse.json({ request: timeOffRequest }, { status: 201 })
  } catch (error) {
    console.error('Error creating time-off request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
