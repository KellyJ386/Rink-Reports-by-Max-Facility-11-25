import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/schedule/analytics - Get schedule analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'viewAll')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to current month
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = endDate
      ? new Date(endDate)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)

    // Get all schedule entries for the period
    const entries = await prisma.scheduleEntry.findMany({
      where: {
        user: { facilityId: user.facilityId },
        date: { gte: start, lte: end },
        status: { in: ['PUBLISHED', 'FILLED'] },
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

    // Calculate hours per employee
    const employeeHours: { [key: string]: { name: string; hours: number; shifts: number } } = {}

    for (const entry of entries) {
      if (entry.isOpenShift) continue

      const userId = entry.userId
      const userName = `${entry.user.firstName} ${entry.user.lastName}`

      if (!employeeHours[userId]) {
        employeeHours[userId] = { name: userName, hours: 0, shifts: 0 }
      }

      // Calculate hours
      const [startH, startM] = entry.startTime.split(':').map(Number)
      const [endH, endM] = entry.endTime.split(':').map(Number)
      let hours = (endH * 60 + endM - startH * 60 - startM) / 60
      if (hours < 0) hours += 24 // Overnight shift

      employeeHours[userId].hours += hours
      employeeHours[userId].shifts += 1
    }

    // Calculate coverage by day of week
    const coverageByDay: { [key: number]: { shifts: number; hours: number } } = {}
    for (let i = 0; i < 7; i++) {
      coverageByDay[i] = { shifts: 0, hours: 0 }
    }

    for (const entry of entries) {
      const dayOfWeek = new Date(entry.date).getDay()
      const [startH, startM] = entry.startTime.split(':').map(Number)
      const [endH, endM] = entry.endTime.split(':').map(Number)
      let hours = (endH * 60 + endM - startH * 60 - startM) / 60
      if (hours < 0) hours += 24

      coverageByDay[dayOfWeek].shifts += 1
      coverageByDay[dayOfWeek].hours += hours
    }

    // Calculate status breakdown
    const allEntries = await prisma.scheduleEntry.findMany({
      where: {
        user: { facilityId: user.facilityId },
        date: { gte: start, lte: end },
      },
    })

    const statusCounts = {
      DRAFT: 0,
      PUBLISHED: 0,
      FILLED: 0,
      CANCELLED: 0,
    }

    for (const entry of allEntries) {
      statusCounts[entry.status as keyof typeof statusCounts] += 1
    }

    // Calculate open shift stats
    const openShiftStats = {
      total: entries.filter(e => e.isOpenShift).length,
      emergency: entries.filter(e => e.isEmergency).length,
      filled: entries.filter(e => e.isOpenShift && e.status === 'FILLED').length,
    }

    // Find potential overtime (>40 hours/week)
    const overtimeRisk: { userId: string; name: string; hours: number }[] = []
    const weeklyHours: { [key: string]: { [week: string]: number } } = {}

    for (const entry of entries) {
      if (entry.isOpenShift) continue

      const userId = entry.userId
      const entryDate = new Date(entry.date)
      const weekStart = new Date(entryDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyHours[userId]) {
        weeklyHours[userId] = {}
      }
      if (!weeklyHours[userId][weekKey]) {
        weeklyHours[userId][weekKey] = 0
      }

      const [startH, startM] = entry.startTime.split(':').map(Number)
      const [endH, endM] = entry.endTime.split(':').map(Number)
      let hours = (endH * 60 + endM - startH * 60 - startM) / 60
      if (hours < 0) hours += 24

      weeklyHours[userId][weekKey] += hours
    }

    // Find weeks with overtime
    for (const userId in weeklyHours) {
      for (const week in weeklyHours[userId]) {
        if (weeklyHours[userId][week] > 40) {
          const emp = employeeHours[userId]
          if (emp && !overtimeRisk.find(o => o.userId === userId)) {
            overtimeRisk.push({
              userId,
              name: emp.name,
              hours: weeklyHours[userId][week],
            })
          }
        }
      }
    }

    return NextResponse.json({
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      },
      summary: {
        totalEntries: allEntries.length,
        totalHours: Object.values(employeeHours).reduce((sum, e) => sum + e.hours, 0),
        averageHoursPerEmployee:
          Object.keys(employeeHours).length > 0
            ? Object.values(employeeHours).reduce((sum, e) => sum + e.hours, 0) /
              Object.keys(employeeHours).length
            : 0,
      },
      employeeHours: Object.entries(employeeHours)
        .map(([id, data]) => ({ userId: id, ...data }))
        .sort((a, b) => b.hours - a.hours),
      coverageByDay: Object.entries(coverageByDay).map(([day, data]) => ({
        dayOfWeek: parseInt(day),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(day)],
        ...data,
      })),
      statusBreakdown: statusCounts,
      openShiftStats,
      overtimeRisk,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
