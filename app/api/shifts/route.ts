import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  Shift,
  CreateShiftInput,
  ShiftFilters,
  ShiftStatus,
  ShiftType,
  SHIFT_COLORS,
  SHIFT_TYPE_COLORS,
} from '@/types/schedule'

// In-memory storage for demo
const shifts = new Map<string, Shift>()

// Sample employees for demo
const sampleEmployees = [
  { id: 'emp-1', firstName: 'John', lastName: 'Smith', email: 'john@rink.com', role: 'Ice Technician' },
  { id: 'emp-2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@rink.com', role: 'Manager' },
  { id: 'emp-3', firstName: 'Mike', lastName: 'Williams', email: 'mike@rink.com', role: 'Ice Technician' },
  { id: 'emp-4', firstName: 'Emily', lastName: 'Brown', email: 'emily@rink.com', role: 'Front Desk' },
  { id: 'emp-5', firstName: 'David', lastName: 'Lee', email: 'david@rink.com', role: 'Zamboni Operator' },
]

// Initialize sample data
function initSampleData() {
  if (shifts.size === 0) {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    // Create shifts for the week
    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + day)
      const dateStr = date.toISOString().split('T')[0]

      // Morning shift
      const morningShift: Shift = {
        id: `shift-${day}-morning`,
        scheduleId: 'schedule-1',
        facilityId: 'facility-1',
        rinkId: 'rink-1',
        date: dateStr,
        startTime: '06:00',
        endTime: '14:00',
        breakDuration: 30,
        title: 'Morning Shift',
        description: 'Opening duties and morning ice maintenance',
        color: SHIFT_COLORS.blue,
        shiftType: 'REGULAR',
        status: day < 5 ? 'FILLED' : 'OPEN',
        isOpen: day >= 5,
        minStaff: 2,
        maxStaff: 3,
        requiredRoles: ['Ice Technician'],
        assignedEmployees: day < 5 ? [
          {
            id: `assign-${day}-morning-1`,
            shiftId: `shift-${day}-morning`,
            employeeId: 'emp-1',
            employee: sampleEmployees[0],
            status: 'CONFIRMED',
            assignedAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
          },
        ] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-1',
        publishedAt: new Date().toISOString(),
      }
      shifts.set(morningShift.id, morningShift)

      // Afternoon shift
      const afternoonShift: Shift = {
        id: `shift-${day}-afternoon`,
        scheduleId: 'schedule-1',
        facilityId: 'facility-1',
        rinkId: 'rink-1',
        date: dateStr,
        startTime: '14:00',
        endTime: '22:00',
        breakDuration: 30,
        title: 'Afternoon Shift',
        description: 'Afternoon ice maintenance and public skating support',
        color: SHIFT_COLORS.green,
        shiftType: 'REGULAR',
        status: 'FILLED',
        isOpen: false,
        minStaff: 2,
        maxStaff: 4,
        requiredRoles: ['Ice Technician', 'Front Desk'],
        assignedEmployees: [
          {
            id: `assign-${day}-afternoon-1`,
            shiftId: `shift-${day}-afternoon`,
            employeeId: 'emp-3',
            employee: sampleEmployees[2],
            status: 'CONFIRMED',
            assignedAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
          },
          {
            id: `assign-${day}-afternoon-2`,
            shiftId: `shift-${day}-afternoon`,
            employeeId: 'emp-4',
            employee: sampleEmployees[3],
            status: 'ASSIGNED',
            assignedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-1',
        publishedAt: new Date().toISOString(),
      }
      shifts.set(afternoonShift.id, afternoonShift)

      // Weekend special shift
      if (day >= 5) {
        const specialShift: Shift = {
          id: `shift-${day}-special`,
          scheduleId: 'schedule-1',
          facilityId: 'facility-1',
          rinkId: 'rink-1',
          date: dateStr,
          startTime: '10:00',
          endTime: '18:00',
          breakDuration: 60,
          title: 'Weekend Special',
          description: 'Weekend public skating support',
          color: SHIFT_COLORS.purple,
          shiftType: 'OVERTIME',
          status: 'OPEN',
          isOpen: true,
          minStaff: 3,
          maxStaff: 5,
          requiredRoles: ['Ice Technician', 'Zamboni Operator'],
          assignedEmployees: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user-1',
          publishedAt: new Date().toISOString(),
        }
        shifts.set(specialShift.id, specialShift)
      }
    }
  }
}

// GET /api/shifts - List shifts with filters
export async function GET(request: NextRequest) {
  try {
    initSampleData()

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status') as ShiftStatus | null
    const employeeId = searchParams.get('employeeId')
    const isOpen = searchParams.get('isOpen')
    const shiftType = searchParams.get('shiftType') as ShiftType | null

    let results = Array.from(shifts.values())

    // Apply filters
    if (scheduleId) {
      results = results.filter((s) => s.scheduleId === scheduleId)
    }
    if (date) {
      results = results.filter((s) => s.date === date)
    }
    if (startDate) {
      results = results.filter((s) => s.date >= startDate)
    }
    if (endDate) {
      results = results.filter((s) => s.date <= endDate)
    }
    if (status) {
      results = results.filter((s) => s.status === status)
    }
    if (employeeId) {
      results = results.filter((s) =>
        s.assignedEmployees.some((a) => a.employeeId === employeeId)
      )
    }
    if (isOpen === 'true') {
      results = results.filter((s) => s.isOpen)
    }
    if (shiftType) {
      results = results.filter((s) => s.shiftType === shiftType)
    }

    // Sort by date and start time
    results.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })

    return NextResponse.json({
      shifts: results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

// POST /api/shifts - Create a new shift
export async function POST(request: NextRequest) {
  try {
    initSampleData()

    const body: CreateShiftInput = await request.json()

    // Validate required fields
    if (!body.scheduleId || !body.date || !body.startTime || !body.endTime || !body.title) {
      return NextResponse.json(
        { error: 'scheduleId, date, startTime, endTime, and title are required' },
        { status: 400 }
      )
    }

    // Validate time range
    if (body.startTime >= body.endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    const shiftId = uuidv4()
    const newShift: Shift = {
      id: shiftId,
      scheduleId: body.scheduleId,
      facilityId: 'facility-1',
      rinkId: body.rinkId,
      templateId: body.templateId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      breakDuration: body.breakDuration || 0,
      title: body.title,
      description: body.description,
      color: body.color || SHIFT_TYPE_COLORS[body.shiftType || 'REGULAR'],
      shiftType: body.shiftType || 'REGULAR',
      status: 'DRAFT',
      isOpen: body.isOpen || false,
      minStaff: body.minStaff || 1,
      maxStaff: body.maxStaff || 1,
      requiredRoles: body.requiredRoles || [],
      notes: body.notes,
      assignedEmployees: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
    }

    // Assign employees if provided
    if (body.assignedEmployeeIds?.length) {
      newShift.assignedEmployees = body.assignedEmployeeIds.map((empId) => {
        const employee = sampleEmployees.find((e) => e.id === empId)
        return {
          id: uuidv4(),
          shiftId,
          employeeId: empId,
          employee: employee || {
            id: empId,
            firstName: 'Unknown',
            lastName: 'Employee',
            email: '',
            role: 'Staff',
          },
          status: 'ASSIGNED' as const,
          assignedAt: new Date().toISOString(),
        }
      })
    }

    shifts.set(newShift.id, newShift)

    return NextResponse.json(newShift, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}

// DELETE /api/shifts - Bulk delete shifts
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { shiftIds } = body as { shiftIds: string[] }

    if (!shiftIds?.length) {
      return NextResponse.json(
        { error: 'shiftIds array is required' },
        { status: 400 }
      )
    }

    let deleted = 0
    for (const id of shiftIds) {
      if (shifts.has(id)) {
        shifts.delete(id)
        deleted++
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
    })
  } catch (error) {
    console.error('Error deleting shifts:', error)
    return NextResponse.json(
      { error: 'Failed to delete shifts' },
      { status: 500 }
    )
  }
}
