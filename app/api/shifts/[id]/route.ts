import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// Validate time format (HH:MM) and return true if valid
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(time)
}

// Convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/shifts/[id] - Get a specific shift definition
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Shifts are used by schedule module, require schedule or admin access
    if (!canUserAccess(user, 'schedule', 'access') && !canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'No permission to access shifts' }, { status: 403 })
    }

    const { id } = await params

    const shift = await prisma.shiftDefinition.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift definition not found' }, { status: 404 })
    }

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json({ error: 'Failed to fetch shift definition' }, { status: 500 })
  }
}

// PUT /api/shifts/[id] - Update a shift definition
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { id } = await params

    // Verify shift belongs to user's facility
    const existingShift = await prisma.shiftDefinition.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift definition not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, startTime, endTime, rinkId, color, isActive } = body

    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json({ error: 'Shift name cannot be empty' }, { status: 400 })
    }

    // Validate time format if provided
    if (startTime !== undefined && !isValidTimeFormat(startTime)) {
      return NextResponse.json({ error: 'Invalid start time format. Use HH:MM (e.g., 09:00, 17:30)' }, { status: 400 })
    }
    if (endTime !== undefined && !isValidTimeFormat(endTime)) {
      return NextResponse.json({ error: 'Invalid end time format. Use HH:MM (e.g., 09:00, 17:30)' }, { status: 400 })
    }

    // Validate end time is after start time (use existing values if not provided)
    const finalStartTime = startTime ?? existingShift.startTime
    const finalEndTime = endTime ?? existingShift.endTime
    if (timeToMinutes(finalEndTime) <= timeToMinutes(finalStartTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const shift = await prisma.shiftDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(rinkId !== undefined && { rinkId }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json({ error: 'Failed to update shift definition' }, { status: 500 })
  }
}

// DELETE /api/shifts/[id] - Soft delete (deactivate) a shift definition
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { id } = await params

    // Verify shift belongs to user's facility
    const existingShift = await prisma.shiftDefinition.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift definition not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.shiftDefinition.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Shift definition deactivated successfully' })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json({ error: 'Failed to delete shift definition' }, { status: 500 })
  }
}
