import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/schedule/recurring - List recurring shift patterns
export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const patterns = await prisma.recurringShiftPattern.findMany({
      where: {
        facilityId: user.facilityId,
      },
      include: {
        assignments: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ patterns })
  } catch (error) {
    console.error('Get recurring patterns error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/recurring - Create a recurring shift pattern
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
      name,
      description,
      patternType,
      daysOfWeek,
      shiftId,
      startTime,
      endTime,
      rinkId,
      startDate,
      endDate,
      assignments, // Array of { userId, dayOfWeek }
    } = body

    // Validation
    if (!name || !patternType || !daysOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, pattern type, days of week, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (24-hour format)' },
        { status: 400 }
      )
    }

    // Validate days of week
    if (!Array.isArray(daysOfWeek) || daysOfWeek.some(d => d < 0 || d > 6)) {
      return NextResponse.json(
        { error: 'Days of week must be an array of numbers 0-6' },
        { status: 400 }
      )
    }

    const pattern = await prisma.recurringShiftPattern.create({
      data: {
        facilityId: user.facilityId,
        name,
        description,
        patternType,
        daysOfWeek,
        shiftId,
        startTime,
        endTime,
        rinkId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: user.id,
        assignments: assignments?.length ? {
          create: assignments.map((a: { userId: string; dayOfWeek: number }) => ({
            userId: a.userId,
            dayOfWeek: a.dayOfWeek,
          })),
        } : undefined,
      },
      include: {
        assignments: true,
      },
    })

    return NextResponse.json({ pattern }, { status: 201 })
  } catch (error) {
    console.error('Create recurring pattern error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
