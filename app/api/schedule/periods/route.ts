import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { createSchedulePeriodSchema, publishSchedulePeriodSchema } from '@/types/schedule'
import { SchedulePeriodStatus, ScheduleStatus } from '@prisma/client'

// GET /api/schedule/periods - Get schedule periods
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as SchedulePeriodStatus | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      facilityId: user.facilityId,
    }

    if (status) where.status = status

    if (startDate) {
      where.endDate = { gte: new Date(startDate) }
    }

    if (endDate) {
      where.startDate = { lte: new Date(endDate) }
    }

    const periods = await prisma.schedulePeriod.findMany({
      where,
      orderBy: { startDate: 'desc' },
    })

    // Get stats for each period
    const periodsWithStats = await Promise.all(
      periods.map(async (period) => {
        const entries = await prisma.scheduleEntry.findMany({
          where: {
            facilityId: user.facilityId,
            date: {
              gte: period.startDate,
              lte: period.endDate,
            },
          },
          select: {
            isOpenShift: true,
            userId: true,
            status: true,
          },
        })

        return {
          ...period,
          totalShifts: entries.length,
          filledShifts: entries.filter((e) => e.userId && !e.isOpenShift).length,
          openShifts: entries.filter((e) => e.isOpenShift || !e.userId).length,
        }
      })
    )

    return NextResponse.json({ periods: periodsWithStats })
  } catch (error) {
    console.error('Error fetching periods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule/periods - Create schedule period
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const result = createSchedulePeriodSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (startDate > endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Check for overlapping periods
    const existingPeriod = await prisma.schedulePeriod.findFirst({
      where: {
        facilityId: user.facilityId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    if (existingPeriod) {
      return NextResponse.json({
        error: 'A schedule period already exists for this date range',
        existingPeriod,
      }, { status: 400 })
    }

    const period = await prisma.schedulePeriod.create({
      data: {
        facilityId: user.facilityId,
        name: data.name,
        startDate,
        endDate,
        notes: data.notes || null,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'SchedulePeriod',
        entityId: period.id,
        newValue: period,
      },
    })

    return NextResponse.json({ period }, { status: 201 })
  } catch (error) {
    console.error('Error creating period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
