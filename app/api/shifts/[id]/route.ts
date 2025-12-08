import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/shifts/[id] - Get a specific shift definition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const shift = await prisma.shiftDefinition.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Get shift error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT /api/shifts/[id] - Update a shift definition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, startTime, endTime, rinkId, color, isActive } = body

    // Verify shift exists and belongs to facility
    const existingShift = await prisma.shiftDefinition.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: 'Invalid start time format. Use HH:MM (24-hour format)' },
        { status: 400 }
      )
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid end time format. Use HH:MM (24-hour format)' },
        { status: 400 }
      )
    }

    // If rinkId provided, verify it belongs to the facility
    if (rinkId) {
      const rink = await prisma.rink.findFirst({
        where: {
          id: rinkId,
          facilityId: user.facilityId,
        },
      })

      if (!rink) {
        return NextResponse.json(
          { error: 'Invalid rink' },
          { status: 400 }
        )
      }
    }

    const updatedShift = await prisma.shiftDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(rinkId !== undefined && { rinkId: rinkId || null }),
        ...(color !== undefined && { color: color || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ shift: updatedShift })
  } catch (error) {
    console.error('Update shift error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/shifts/[id] - Delete a shift definition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

    // Verify shift exists and belongs to facility
    const existingShift = await prisma.shiftDefinition.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Soft delete by marking as inactive (to preserve historical data)
    await prisma.shiftDefinition.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Shift deleted successfully' })
  } catch (error) {
    console.error('Delete shift error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
