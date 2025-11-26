import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/schedule - List schedule entries
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const permissions = getUserPermissions(user)
    const canViewAll = permissions.schedule?.viewAll

    const where: any = {}

    // Date range filter
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    // User filter - if can't view all, only show own schedule
    if (!canViewAll) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Only show published schedules to non-admins
    if (!permissions.schedule?.publish) {
      where.OR = [
        { status: 'PUBLISHED' },
        { status: 'FILLED' },
        { userId: user.id }, // Can always see own entries
      ]
    }

    const entries = await prisma.scheduleEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

// POST /api/schedule - Create a schedule entry
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.edit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      isEmergency,
    } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: date, startTime, endTime' },
        { status: 400 }
      )
    }

    // If not open shift, userId is required
    if (!isOpenShift && !assignedUserId) {
      return NextResponse.json(
        { error: 'userId is required for non-open shifts' },
        { status: 400 }
      )
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: assignedUserId || user.id,
        shiftId: shiftId || null,
        rinkId: rinkId || null,
        date: new Date(date),
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
