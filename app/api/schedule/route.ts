import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// Validate time format (HH:MM) and return true if valid
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(time)
}

// Convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// GET /api/schedule - List schedule entries
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      user: {
        facilityId: user.facilityId,
      },
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      }
    }

    // If user can only view their own, filter by their user ID
    if (!canUserAccess(user, 'schedule', 'viewAll')) {
      where.OR = [
        { userId: user.id },
        { isOpenShift: true, status: 'PUBLISHED' },
      ]
    } else if (userId) {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    const entries = await prisma.scheduleEntry.findMany({
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
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// POST /api/schedule - Create a new schedule entry
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift,
      isEmergency,
      status,
    } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // For open shifts, userId is optional
    if (!isOpenShift && !userId) {
      return NextResponse.json(
        { error: 'User ID is required for assigned shifts' },
        { status: 400 }
      )
    }

    // Verify the assigned user is in the same facility
    if (userId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: userId,
          facilityId: user.facilityId,
        },
      })

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'User not found in this facility' },
          { status: 400 }
        )
      }
    }

    // Verify rink belongs to same facility
    if (rinkId) {
      const rink = await prisma.rink.findFirst({
        where: { id: rinkId, facilityId: user.facilityId },
      })
      if (!rink) {
        return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
      }
    }

    // Verify shift belongs to same facility if provided
    if (shiftId) {
      const shift = await prisma.shiftDefinition.findFirst({
        where: { id: shiftId, facilityId: user.facilityId },
      })
      if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
      }
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: userId || user.id, // Default to creator for open shifts
        shiftId: shiftId || null,
        rinkId: rinkId || null,
        date: new Date(date),
        startTime,
        endTime,
        isOpenShift: isOpenShift || false,
        isEmergency: isEmergency || false,
        status: status || 'DRAFT',
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

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule entry' },
      { status: 500 }
    )
  }
}
