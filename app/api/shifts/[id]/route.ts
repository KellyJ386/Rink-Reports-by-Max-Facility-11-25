import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

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

    // Validate end time is after start time (use existing values if not provided)
    const finalStartTime = startTime ?? existingShift.startTime
    const finalEndTime = endTime ?? existingShift.endTime
    if (finalEndTime <= finalStartTime) {
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
