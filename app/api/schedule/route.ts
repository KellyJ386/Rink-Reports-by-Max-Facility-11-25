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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const openOnly = searchParams.get('openOnly') === 'true'
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || 20)) : undefined
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam) || 0) : undefined

    const where = {
      user: { facilityId: user.facilityId },
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(userId && { userId }),
      ...(openOnly && { isOpenShift: true, status: { not: 'FILLED' as const } }),
    }

    const [entries, total] = await Promise.all([
      prisma.scheduleEntry.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.scheduleEntry.count({ where }),
    ])

    return NextResponse.json({ entries, total, ...(limit !== undefined && { limit, offset: offset || 0 }) })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

// POST /api/schedule - Create schedule entry
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'No permission to create schedule entries' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, shiftId, rinkId, date, startTime, endTime, isOpenShift, isEmergency, notes } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Date, start time, and end time are required' }, { status: 400 })
    }

    // Validate time format
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:MM format.' }, { status: 400 })
    }

    // Validate end time is after start time
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    // For non-open shifts, require a user
    if (!isOpenShift && !userId) {
      return NextResponse.json({ error: 'User ID is required for assigned shifts' }, { status: 400 })
    }

    // Verify user belongs to same facility
    if (userId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, facilityId: user.facilityId },
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: userId || user.id, // Use current user as placeholder for open shifts
        shiftId,
        rinkId,
        date: new Date(date),
        startTime,
        endTime,
        isOpenShift: isOpenShift || false,
        isEmergency: isEmergency || false,
        status: 'DRAFT',
        createdById: user.id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json({ error: 'Failed to create schedule entry' }, { status: 500 })
  }
}
