import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'

// GET /api/schedule - List schedule entries
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const permissions = await getUserPermissions(session.user.id)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}

    // Only show own schedule if user doesn't have viewAll
    if (!permissions.schedule?.viewAll) {
      where.userId = session.user.id
    } else if (userId) {
      where.userId = userId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (status) {
      where.status = status
    }

    const entries = await prisma.scheduleEntry.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
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

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/schedule - Create schedule entry
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canCreate = await canUserAccess(session.user.id, 'schedule', 'create')
    if (!canCreate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift = false,
      isEmergency = false,
    } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Date, start time, and end time are required' },
        { status: 400 }
      )
    }

    if (!userId && !isOpenShift) {
      return NextResponse.json(
        { error: 'User ID is required for non-open shifts' },
        { status: 400 }
      )
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: userId || session.user.id, // For open shifts, temporarily assign to creator
        shiftId,
        rinkId,
        date: new Date(date),
        startTime,
        endTime,
        isOpenShift,
        isEmergency,
        status: 'DRAFT',
        createdById: session.user.id,
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

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
