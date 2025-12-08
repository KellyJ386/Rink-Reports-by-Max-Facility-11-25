import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { scheduleExportOptionsSchema } from '@/types/schedule'
import { format, parseISO, eachDayOfInterval } from 'date-fns'

// POST /api/schedule/export - Export schedule data
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'export')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const result = scheduleExportOptionsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const options = result.data
    const startDate = new Date(options.startDate)
    const endDate = new Date(options.endDate)

    // Fetch schedule entries
    const entries = await prisma.scheduleEntry.findMany({
      where: {
        facilityId: user.facilityId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: options.includeEmployeeDetails
          ? {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: { select: { name: true } },
              },
            }
          : { select: { id: true, firstName: true, lastName: true } },
        shift: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    if (options.format === 'csv') {
      const csv = generateCSV(entries, options)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="schedule_${options.startDate}_to_${options.endDate}.csv"`,
        },
      })
    }

    if (options.format === 'pdf') {
      // For PDF, return structured data that can be rendered client-side
      // or use a PDF generation library
      const pdfData = generatePDFData(entries, options, startDate, endDate)
      return NextResponse.json({ data: pdfData, format: 'pdf' })
    }

    // Default JSON export
    return NextResponse.json({ entries, options })
  } catch (error) {
    console.error('Error exporting schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCSV(entries: any[], options: any): string {
  const headers = [
    'Date',
    'Day',
    'Shift',
    'Start Time',
    'End Time',
    'Employee',
    'Role',
    'Status',
    'Hours',
  ]

  if (options.includeEmployeeDetails) {
    headers.push('Email', 'Phone')
  }

  if (options.includeNotes) {
    headers.push('Notes')
  }

  const rows: string[][] = [headers]

  // Group by options.groupBy if needed
  let sortedEntries = [...entries]

  if (options.groupBy === 'employee') {
    sortedEntries.sort((a, b) => {
      const nameA = a.user ? `${a.user.lastName} ${a.user.firstName}` : 'ZZZZ'
      const nameB = b.user ? `${b.user.lastName} ${b.user.firstName}` : 'ZZZZ'
      if (nameA !== nameB) return nameA.localeCompare(nameB)
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  } else if (options.groupBy === 'shift') {
    sortedEntries.sort((a, b) => {
      const shiftA = a.shift?.name || 'ZZZZ'
      const shiftB = b.shift?.name || 'ZZZZ'
      if (shiftA !== shiftB) return shiftA.localeCompare(shiftB)
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }

  for (const entry of sortedEntries) {
    const date = new Date(entry.date)
    const hours = calculateHours(entry.startTime, entry.endTime, entry.breakMinutes)

    const row = [
      format(date, 'yyyy-MM-dd'),
      format(date, 'EEEE'),
      entry.shift?.name || '-',
      formatTime12h(entry.startTime),
      formatTime12h(entry.endTime),
      entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'OPEN',
      entry.user?.role?.name || '-',
      entry.status,
      hours.toFixed(1),
    ]

    if (options.includeEmployeeDetails) {
      row.push(entry.user?.email || '-')
      row.push(entry.user?.phone || '-')
    }

    if (options.includeNotes) {
      row.push(entry.notes || '')
    }

    rows.push(row)
  }

  // Convert to CSV string
  return rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const str = String(cell)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    )
    .join('\n')
}

function generatePDFData(
  entries: any[],
  options: any,
  startDate: Date,
  endDate: Date
): any {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Group entries by date
  const entriesByDate = new Map<string, any[]>()
  for (const entry of entries) {
    const dateStr = format(new Date(entry.date), 'yyyy-MM-dd')
    const existing = entriesByDate.get(dateStr) || []
    existing.push(entry)
    entriesByDate.set(dateStr, existing)
  }

  // Build structured data for PDF rendering
  const scheduleData = days.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayEntries = entriesByDate.get(dateStr) || []

    return {
      date: dateStr,
      dayName: format(date, 'EEEE'),
      displayDate: format(date, 'MMM d, yyyy'),
      entries: dayEntries.map((entry: any) => ({
        id: entry.id,
        shiftName: entry.shift?.name || 'Custom',
        startTime: formatTime12h(entry.startTime),
        endTime: formatTime12h(entry.endTime),
        employee: entry.user
          ? `${entry.user.firstName} ${entry.user.lastName}`
          : 'OPEN SHIFT',
        role: entry.user?.role?.name || '-',
        hours: calculateHours(entry.startTime, entry.endTime, entry.breakMinutes),
        status: entry.status,
        isOpenShift: entry.isOpenShift,
        notes: options.includeNotes ? entry.notes : undefined,
      })),
    }
  })

  // Calculate summary stats
  const totalShifts = entries.length
  const filledShifts = entries.filter((e) => e.userId).length
  const totalHours = entries.reduce(
    (sum, e) => sum + calculateHours(e.startTime, e.endTime, e.breakMinutes),
    0
  )

  // Employee summary
  const employeeHours = new Map<string, { name: string; hours: number; shifts: number }>()
  for (const entry of entries) {
    if (entry.user) {
      const key = entry.user.id
      const existing = employeeHours.get(key) || {
        name: `${entry.user.firstName} ${entry.user.lastName}`,
        hours: 0,
        shifts: 0,
      }
      existing.hours += calculateHours(entry.startTime, entry.endTime, entry.breakMinutes)
      existing.shifts += 1
      employeeHours.set(key, existing)
    }
  }

  return {
    title: `Schedule: ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
    generatedAt: new Date().toISOString(),
    schedule: scheduleData,
    summary: {
      totalShifts,
      filledShifts,
      openShifts: totalShifts - filledShifts,
      totalHours: Math.round(totalHours * 10) / 10,
    },
    employeeSummary: Array.from(employeeHours.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }
}

function calculateHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)

  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM)
  if (totalMinutes < 0) totalMinutes += 24 * 60 // Handle overnight

  totalMinutes -= breakMinutes
  return totalMinutes / 60
}

function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}
