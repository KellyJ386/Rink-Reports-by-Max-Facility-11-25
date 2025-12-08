import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/schedule/export - Export schedule data
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
    const format = searchParams.get('format') || 'csv'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get schedule entries
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
            email: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    })

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Day',
        'Employee',
        'Email',
        'Start Time',
        'End Time',
        'Hours',
        'Status',
        'Open Shift',
        'Emergency',
      ]

      const rows = entries.map(entry => {
        const date = new Date(entry.date)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

        // Calculate hours
        const [startH, startM] = entry.startTime.split(':').map(Number)
        const [endH, endM] = entry.endTime.split(':').map(Number)
        let hours = (endH * 60 + endM - startH * 60 - startM) / 60
        if (hours < 0) hours += 24

        return [
          date.toISOString().split('T')[0],
          dayNames[date.getDay()],
          entry.isOpenShift ? 'OPEN' : `${entry.user.firstName} ${entry.user.lastName}`,
          entry.isOpenShift ? '' : entry.user.email,
          entry.startTime,
          entry.endTime,
          hours.toFixed(2),
          entry.status,
          entry.isOpenShift ? 'Yes' : 'No',
          entry.isEmergency ? 'Yes' : 'No',
        ]
      })

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="schedule-${startDate}-${endDate}.csv"`,
        },
      })
    }

    if (format === 'json') {
      return NextResponse.json({
        period: { startDate, endDate },
        entries: entries.map(entry => ({
          date: new Date(entry.date).toISOString().split('T')[0],
          employee: entry.isOpenShift ? null : {
            name: `${entry.user.firstName} ${entry.user.lastName}`,
            email: entry.user.email,
          },
          startTime: entry.startTime,
          endTime: entry.endTime,
          status: entry.status,
          isOpenShift: entry.isOpenShift,
          isEmergency: entry.isEmergency,
        })),
      })
    }

    // Payroll format - hours summary by employee
    if (format === 'payroll') {
      const employeeHours: { [key: string]: any } = {}

      for (const entry of entries) {
        if (entry.isOpenShift) continue

        const userId = entry.userId
        if (!employeeHours[userId]) {
          employeeHours[userId] = {
            employeeId: userId,
            firstName: entry.user.firstName,
            lastName: entry.user.lastName,
            email: entry.user.email,
            totalHours: 0,
            regularHours: 0,
            overtimeHours: 0,
            shifts: 0,
          }
        }

        const [startH, startM] = entry.startTime.split(':').map(Number)
        const [endH, endM] = entry.endTime.split(':').map(Number)
        let hours = (endH * 60 + endM - startH * 60 - startM) / 60
        if (hours < 0) hours += 24

        employeeHours[userId].totalHours += hours
        employeeHours[userId].shifts += 1
      }

      // Calculate overtime (simple: anything over 40 total is overtime)
      for (const emp of Object.values(employeeHours)) {
        if (emp.totalHours > 40) {
          emp.regularHours = 40
          emp.overtimeHours = emp.totalHours - 40
        } else {
          emp.regularHours = emp.totalHours
          emp.overtimeHours = 0
        }
      }

      const payrollData = Object.values(employeeHours)

      // CSV format for payroll
      const headers = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Email',
        'Total Hours',
        'Regular Hours',
        'Overtime Hours',
        'Shifts',
      ]

      const rows = payrollData.map((emp: any) => [
        emp.employeeId,
        emp.firstName,
        emp.lastName,
        emp.email,
        emp.totalHours.toFixed(2),
        emp.regularHours.toFixed(2),
        emp.overtimeHours.toFixed(2),
        emp.shifts,
      ])

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payroll-${startDate}-${endDate}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export schedule error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
