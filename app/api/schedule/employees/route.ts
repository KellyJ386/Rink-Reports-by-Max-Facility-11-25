import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { format, startOfWeek, endOfWeek } from 'date-fns'

// GET /api/schedule/employees - Get employees for scheduling
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
    const includeAvailability = searchParams.get('includeAvailability') === 'true'
    const includeSchedule = searchParams.get('includeSchedule') === 'true'
    const weekOf = searchParams.get('weekOf')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const employees = await prisma.user.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: activeOnly,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        availability: includeAvailability,
        scheduleEntries: includeSchedule
          ? {
              where: weekOf
                ? {
                    date: {
                      gte: startOfWeek(new Date(weekOf), { weekStartsOn: 0 }),
                      lte: endOfWeek(new Date(weekOf), { weekStartsOn: 0 }),
                    },
                  }
                : {
                    date: { gte: new Date() },
                  },
              include: {
                shift: true,
              },
              take: 50,
              orderBy: { date: 'asc' },
            }
          : false,
        timeOffRequests: {
          where: {
            status: 'APPROVED',
            endDate: { gte: new Date() },
          },
          take: 10,
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    // Calculate summaries if needed
    const employeesWithSummary = await Promise.all(
      employees.map(async (emp) => {
        let totalHours = 0
        let scheduledShifts = 0

        if (includeSchedule && emp.scheduleEntries) {
          scheduledShifts = emp.scheduleEntries.length

          for (const entry of emp.scheduleEntries) {
            const [startH, startM] = entry.startTime.split(':').map(Number)
            const [endH, endM] = entry.endTime.split(':').map(Number)
            let mins = (endH * 60 + endM) - (startH * 60 + startM)
            if (mins < 0) mins += 24 * 60
            mins -= entry.breakMinutes || 0
            totalHours += mins / 60
          }
        }

        return {
          ...emp,
          totalHours: Math.round(totalHours * 10) / 10,
          scheduledShifts,
          pendingTimeOff: emp.timeOffRequests?.length || 0,
        }
      })
    )

    return NextResponse.json({ employees: employeesWithSummary })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
