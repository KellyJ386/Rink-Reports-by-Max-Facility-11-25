import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Shift, UpdateShiftInput, ShiftAssignment } from '@/types/schedule'

// In-memory storage reference
const shifts = new Map<string, Shift>()

// Sample employees for demo
const sampleEmployees = [
  { id: 'emp-1', firstName: 'John', lastName: 'Smith', email: 'john@rink.com', role: 'Ice Technician' },
  { id: 'emp-2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@rink.com', role: 'Manager' },
  { id: 'emp-3', firstName: 'Mike', lastName: 'Williams', email: 'mike@rink.com', role: 'Ice Technician' },
  { id: 'emp-4', firstName: 'Emily', lastName: 'Brown', email: 'emily@rink.com', role: 'Front Desk' },
  { id: 'emp-5', firstName: 'David', lastName: 'Lee', email: 'david@rink.com', role: 'Zamboni Operator' },
]

// GET /api/shifts/[id] - Get a single shift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shift = shifts.get(id)

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shift' },
      { status: 500 }
    )
  }
}

// PATCH /api/shifts/[id] - Update a shift
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shift = shifts.get(id)

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    const body: UpdateShiftInput = await request.json()

    // Validate time range if times are being updated
    if (body.startTime || body.endTime) {
      const startTime = body.startTime || shift.startTime
      const endTime = body.endTime || shift.endTime
      if (startTime >= endTime) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        )
      }
    }

    const updatedShift: Shift = {
      ...shift,
      ...body,
      id: shift.id,
      scheduleId: shift.scheduleId,
      facilityId: shift.facilityId,
      createdAt: shift.createdAt,
      createdBy: shift.createdBy,
      assignedEmployees: shift.assignedEmployees,
      updatedAt: new Date().toISOString(),
    }

    shifts.set(id, updatedShift)

    return NextResponse.json(updatedShift)
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: 'Failed to update shift' },
      { status: 500 }
    )
  }
}

// DELETE /api/shifts/[id] - Delete a shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shift = shifts.get(id)

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    // Check if shift is published and has assignments
    if (shift.status === 'PUBLISHED' && shift.assignedEmployees.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a published shift with assignments. Cancel or reassign first.' },
        { status: 400 }
      )
    }

    shifts.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json(
      { error: 'Failed to delete shift' },
      { status: 500 }
    )
  }
}

// POST /api/shifts/[id]/assign - Assign employees to shift
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shift = shifts.get(id)

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, employeeId, employeeIds } = body as {
      action: 'assign' | 'unassign' | 'confirm' | 'decline'
      employeeId?: string
      employeeIds?: string[]
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let updatedShift = { ...shift }

    switch (action) {
      case 'assign': {
        const idsToAssign = employeeIds || (employeeId ? [employeeId] : [])
        if (!idsToAssign.length) {
          return NextResponse.json(
            { error: 'employeeId or employeeIds required for assign action' },
            { status: 400 }
          )
        }

        // Check max staff
        if (updatedShift.assignedEmployees.length + idsToAssign.length > updatedShift.maxStaff) {
          return NextResponse.json(
            { error: `Cannot exceed maximum staff of ${updatedShift.maxStaff}` },
            { status: 400 }
          )
        }

        // Add new assignments
        for (const empId of idsToAssign) {
          // Check if already assigned
          if (updatedShift.assignedEmployees.some((a) => a.employeeId === empId)) {
            continue
          }

          const employee = sampleEmployees.find((e) => e.id === empId)
          const newAssignment: ShiftAssignment = {
            id: uuidv4(),
            shiftId: id,
            employeeId: empId,
            employee: employee || {
              id: empId,
              firstName: 'Unknown',
              lastName: 'Employee',
              email: '',
              role: 'Staff',
            },
            status: 'ASSIGNED',
            assignedAt: new Date().toISOString(),
          }
          updatedShift.assignedEmployees.push(newAssignment)
        }

        // Update status
        if (updatedShift.assignedEmployees.length >= updatedShift.minStaff) {
          updatedShift.status = 'FILLED'
          updatedShift.isOpen = false
        }
        break
      }

      case 'unassign': {
        if (!employeeId) {
          return NextResponse.json(
            { error: 'employeeId required for unassign action' },
            { status: 400 }
          )
        }

        updatedShift.assignedEmployees = updatedShift.assignedEmployees.filter(
          (a) => a.employeeId !== employeeId
        )

        // Update status
        if (updatedShift.assignedEmployees.length < updatedShift.minStaff) {
          updatedShift.status = 'OPEN'
          updatedShift.isOpen = true
        }
        break
      }

      case 'confirm': {
        if (!employeeId) {
          return NextResponse.json(
            { error: 'employeeId required for confirm action' },
            { status: 400 }
          )
        }

        updatedShift.assignedEmployees = updatedShift.assignedEmployees.map((a) =>
          a.employeeId === employeeId
            ? { ...a, status: 'CONFIRMED' as const, confirmedAt: new Date().toISOString() }
            : a
        )
        break
      }

      case 'decline': {
        if (!employeeId) {
          return NextResponse.json(
            { error: 'employeeId required for decline action' },
            { status: 400 }
          )
        }

        updatedShift.assignedEmployees = updatedShift.assignedEmployees.map((a) =>
          a.employeeId === employeeId
            ? { ...a, status: 'DECLINED' as const }
            : a
        )

        // Check if we need more staff
        const activeAssignments = updatedShift.assignedEmployees.filter(
          (a) => a.status !== 'DECLINED'
        )
        if (activeAssignments.length < updatedShift.minStaff) {
          updatedShift.status = 'OPEN'
          updatedShift.isOpen = true
        }
        break
      }
    }

    updatedShift.updatedAt = new Date().toISOString()
    shifts.set(id, updatedShift)

    return NextResponse.json(updatedShift)
  } catch (error) {
    console.error('Error updating shift assignments:', error)
    return NextResponse.json(
      { error: 'Failed to update shift assignments' },
      { status: 500 }
    )
  }
}
