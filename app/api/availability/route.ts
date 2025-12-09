import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  Availability,
  CreateAvailabilityInput,
  AvailabilityWithEmployee,
} from '@/types/schedule'

// In-memory storage for demo
const availabilities = new Map<string, Availability>()

// Sample employees
const sampleEmployees = [
  { id: 'emp-1', firstName: 'John', lastName: 'Smith', avatar: undefined },
  { id: 'emp-2', firstName: 'Sarah', lastName: 'Johnson', avatar: undefined },
  { id: 'emp-3', firstName: 'Mike', lastName: 'Williams', avatar: undefined },
  { id: 'emp-4', firstName: 'Emily', lastName: 'Brown', avatar: undefined },
  { id: 'emp-5', firstName: 'David', lastName: 'Lee', avatar: undefined },
]

// Initialize sample data
function initSampleData() {
  if (availabilities.size === 0) {
    const today = new Date()

    // John's availability - available weekdays
    for (let i = 1; i <= 5; i++) {
      const avail: Availability = {
        id: `avail-emp1-${i}`,
        employeeId: 'emp-1',
        date: getNextWeekday(today, i).toISOString().split('T')[0],
        startTime: '06:00',
        endTime: '16:00',
        allDay: false,
        type: 'AVAILABLE',
        isRecurring: true,
        recurrencePattern: 'WEEKLY',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      availabilities.set(avail.id, avail)
    }

    // Sarah's availability - prefers afternoons
    const sarahAvail: Availability = {
      id: 'avail-emp2-1',
      employeeId: 'emp-2',
      date: today.toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '22:00',
      allDay: false,
      type: 'PREFERRED',
      isRecurring: true,
      recurrencePattern: 'DAILY',
      reason: 'Prefers afternoon/evening shifts',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    availabilities.set(sarahAvail.id, sarahAvail)

    // Mike's unavailability - next Tuesday
    const nextTuesday = getNextWeekday(today, 2)
    const mikeUnavail: Availability = {
      id: 'avail-emp3-1',
      employeeId: 'emp-3',
      date: nextTuesday.toISOString().split('T')[0],
      allDay: true,
      type: 'UNAVAILABLE',
      isRecurring: false,
      reason: 'Doctor appointment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    availabilities.set(mikeUnavail.id, mikeUnavail)
  }
}

function getNextWeekday(from: Date, dayOfWeek: number): Date {
  const result = new Date(from)
  const currentDay = result.getDay()
  const daysUntil = (dayOfWeek - currentDay + 7) % 7
  result.setDate(result.getDate() + (daysUntil === 0 ? 7 : daysUntil))
  return result
}

// GET /api/availability - List availability with filters
export async function GET(request: NextRequest) {
  try {
    initSampleData()

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const includeEmployee = searchParams.get('includeEmployee') === 'true'

    let results = Array.from(availabilities.values())

    // Apply filters
    if (employeeId) {
      results = results.filter((a) => a.employeeId === employeeId)
    }
    if (date) {
      results = results.filter((a) => a.date === date)
    }
    if (startDate) {
      results = results.filter((a) => a.date >= startDate)
    }
    if (endDate) {
      results = results.filter((a) => a.date <= endDate)
    }
    if (type) {
      results = results.filter((a) => a.type === type)
    }

    // Sort by date
    results.sort((a, b) => a.date.localeCompare(b.date))

    // Include employee info if requested
    if (includeEmployee) {
      const withEmployee: AvailabilityWithEmployee[] = results.map((a) => ({
        ...a,
        employee: sampleEmployees.find((e) => e.id === a.employeeId) || {
          id: a.employeeId,
          firstName: 'Unknown',
          lastName: 'Employee',
        },
      }))
      return NextResponse.json({
        availabilities: withEmployee,
        total: withEmployee.length,
      })
    }

    return NextResponse.json({
      availabilities: results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

// POST /api/availability - Create availability
export async function POST(request: NextRequest) {
  try {
    initSampleData()

    const body: CreateAvailabilityInput & { employeeId?: string } = await request.json()

    // Validate required fields
    if (!body.date || !body.type) {
      return NextResponse.json(
        { error: 'date and type are required' },
        { status: 400 }
      )
    }

    // Validate time range if not all day
    if (!body.allDay && body.startTime && body.endTime) {
      if (body.startTime >= body.endTime) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        )
      }
    }

    const newAvailability: Availability = {
      id: uuidv4(),
      employeeId: body.employeeId || 'emp-1', // Would come from auth context
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      allDay: body.allDay ?? true,
      type: body.type,
      isRecurring: body.isRecurring ?? false,
      recurrencePattern: body.recurrencePattern,
      recurrenceEndDate: body.recurrenceEndDate,
      reason: body.reason,
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    availabilities.set(newAvailability.id, newAvailability)

    return NextResponse.json(newAvailability, { status: 201 })
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    )
  }
}
