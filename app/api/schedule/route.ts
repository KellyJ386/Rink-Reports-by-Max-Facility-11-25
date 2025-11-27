import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

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

    const entries = await prisma.scheduleEntry.findMany({
      where: {
        user: { facilityId: user.facilityId },
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
        ...(userId && { userId }),
        ...(openOnly && { isOpenShift: true, status: { not: 'FILLED' } }),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({ entries })
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
