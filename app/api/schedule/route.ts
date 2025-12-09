import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/schedule - List schedule entries with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const rinkId = searchParams.get('rinkId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const where: any = {}

    if (userId) where.userId = userId
    if (rinkId) where.rinkId = rinkId
    if (status) where.status = status

    // Date range filter
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
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

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
  }
}

// POST /api/schedule - Create a new schedule entry
export async function POST(request: NextRequest) {
  try {
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
      createdById,
    } = body

    if (!userId || !date || !startTime || !endTime || !createdById) {
      return NextResponse.json(
        { error: 'userId, date, startTime, endTime, and createdById are required' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'startTime and endTime must be in HH:MM format (24-hour)' },
        { status: 400 }
      )
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId,
        shiftId,
        rinkId,
        date: new Date(date),
        startTime,
        endTime,
        isOpenShift: isOpenShift || false,
        isEmergency: isEmergency || false,
        status: 'DRAFT',
        createdById,
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

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json({ error: 'Failed to create schedule entry' }, { status: 500 })
  }
}
