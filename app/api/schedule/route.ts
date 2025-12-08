import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { ScheduleBroadcast } from '@/lib/realtime'

// GET /api/schedule - List schedule entries
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const rinkId = searchParams.get('rinkId')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const openShiftsOnly = searchParams.get('openShiftsOnly') === 'true'
    const emergencyOnly = searchParams.get('emergencyOnly') === 'true'

    // Check if user can view all schedules or only their own
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')

    // Build query filters
    const where: any = {}

    // If user can't view all, only show their own schedule entries
    // Exception: open shifts should be visible to all users who can access schedule
    if (!canViewAll && !openShiftsOnly) {
      where.userId = user.id
    }

    // Date range filter
    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) }
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) }
    }

    // Rink filter
    if (rinkId) {
      where.rinkId = rinkId
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // User filter (only if canViewAll)
    if (userId && canViewAll) {
      where.userId = userId
    }

    // Open shifts filter
    if (openShiftsOnly) {
      where.isOpenShift = true
      where.status = { in: ['PUBLISHED', 'DRAFT'] }
    }

    // Emergency filter
    if (emergencyOnly) {
      where.isEmergency = true
    }

    const scheduleEntries = await prisma.scheduleEntry.findMany({
      where,
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
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    })

    return NextResponse.json({ scheduleEntries })
  } catch (error) {
    console.error('Get schedule entries error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/schedule - Create a new schedule entry
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId: assignedUserId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift,
      isEmergency
    } = body

    // Validation
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // For non-open shifts, userId is required
    if (!isOpenShift && !assignedUserId) {
      return NextResponse.json(
        { error: 'User ID is required for assigned shifts' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (24-hour format)' },
        { status: 400 }
      )
    }

    // Validate date
    const scheduleDate = new Date(date)
    if (isNaN(scheduleDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // If userId provided, verify they belong to the same facility
    if (assignedUserId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedUserId,
          facilityId: user.facilityId,
          isActive: true,
        },
      })

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Invalid user' },
          { status: 400 }
        )
      }
    }

    // If shiftId provided, verify it belongs to the facility
    if (shiftId) {
      const shift = await prisma.shiftDefinition.findFirst({
        where: {
          id: shiftId,
          facilityId: user.facilityId,
        },
      })

      if (!shift) {
        return NextResponse.json(
          { error: 'Invalid shift' },
          { status: 400 }
        )
      }
    }

    // If rinkId provided, verify it belongs to the facility
    if (rinkId) {
      const rink = await prisma.rink.findFirst({
        where: {
          id: rinkId,
          facilityId: user.facilityId,
        },
      })

      if (!rink) {
        return NextResponse.json(
          { error: 'Invalid rink' },
          { status: 400 }
        )
      }
    }

    const scheduleEntry = await prisma.scheduleEntry.create({
      data: {
        userId: assignedUserId || user.id, // For open shifts, use creator as placeholder
        shiftId: shiftId || null,
        rinkId: rinkId || null,
        date: scheduleDate,
        startTime,
        endTime,
        isOpenShift: isOpenShift || false,
        isEmergency: isEmergency || false,
        status: 'DRAFT',
        createdById: user.id,
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

    // Broadcast real-time update
    await ScheduleBroadcast.created(user.facilityId, scheduleEntry)

    return NextResponse.json({ scheduleEntry }, { status: 201 })
  } catch (error) {
    console.error('Create schedule entry error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
