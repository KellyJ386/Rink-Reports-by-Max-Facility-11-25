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

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const rinkId = searchParams.get('rinkId')
    const status = searchParams.get('status')

    // Check view permission
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')

    // Build where clause
    const where: Record<string, unknown> = {}

    // If user can't view all, only show their own entries
    if (!canViewAll) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (status) {
      where.status = status
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate)
      }
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

    return NextResponse.json({ entries })
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

    // Check edit permission
    const canEdit = canUserAccess(user, 'schedule', 'edit')
    if (!canEdit) {
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
      isOpenShift = false,
      isEmergency = false,
    } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'date, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // For open shifts, assignedUserId may be null
    if (!isOpenShift && !assignedUserId) {
      return NextResponse.json(
        { error: 'userId is required for non-open shifts' },
        { status: 400 }
      )
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: assignedUserId || user.id, // For open shifts, temporarily assign to creator
        shiftId,
        rinkId,
        date: new Date(date),
        startTime,
        endTime,
        isOpenShift,
        isEmergency,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'ScheduleEntry',
        entityId: entry.id,
        newValue: {
          date,
          startTime,
          endTime,
          isOpenShift,
          isEmergency,
        },
      },
    })

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule entry' },
      { status: 500 }
    )
  }
}
