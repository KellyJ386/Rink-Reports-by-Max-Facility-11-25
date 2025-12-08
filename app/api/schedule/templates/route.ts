import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/schedule/templates - List schedule templates
export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const templates = await prisma.scheduleTemplate.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/templates - Save current week as template
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
    const { name, description, weekStartDate } = body

    if (!name || !weekStartDate) {
      return NextResponse.json(
        { error: 'Name and week start date are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(weekStartDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)

    // Get all entries for the week
    const entries = await prisma.scheduleEntry.findMany({
      where: {
        user: { facilityId: user.facilityId },
        date: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
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

    // Transform entries to template format (relative to week)
    const weekData = entries.map(entry => {
      const entryDate = new Date(entry.date)
      const dayOfWeek = entryDate.getDay()

      return {
        dayOfWeek,
        userId: entry.userId,
        userName: `${entry.user.firstName} ${entry.user.lastName}`,
        shiftId: entry.shiftId,
        rinkId: entry.rinkId,
        startTime: entry.startTime,
        endTime: entry.endTime,
        isOpenShift: entry.isOpenShift,
      }
    })

    const template = await prisma.scheduleTemplate.create({
      data: {
        facilityId: user.facilityId,
        name,
        description,
        weekData,
        createdById: user.id,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
