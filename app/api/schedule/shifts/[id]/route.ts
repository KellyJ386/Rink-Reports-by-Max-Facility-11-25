import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { validateShiftDefinition } from '@/lib/schedule'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/schedule/shifts/[id] - Get a single shift definition
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await context.params

    const shift = await prisma.shiftDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scheduleEntries: true }
        }
      }
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shift definition' },
      { status: 500 }
    )
  }
}

// PUT /api/schedule/shifts/[id] - Update a shift definition
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to edit shift definitions' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.shiftDefinition.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, startTime, endTime, color, minStaffRequired, maxStaffAllowed, isActive } = body

    // Validate if updating time/name fields
    if (name || startTime || endTime) {
      const validation = validateShiftDefinition({
        name: name || existing.name,
        startTime: startTime || existing.startTime,
        endTime: endTime || existing.endTime,
        minStaffRequired: minStaffRequired ?? existing.minStaffRequired,
        maxStaffAllowed: maxStaffAllowed ?? existing.maxStaffAllowed
      })

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        )
      }
    }

    // Check for duplicate name if changing name
    if (name && name !== existing.name) {
      const duplicate = await prisma.shiftDefinition.findFirst({
        where: {
          facilityId: user.facilityId,
          name: name.trim(),
          rinkId: existing.rinkId,
          id: { not: id }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A shift with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (color !== undefined) updateData.color = color
    if (minStaffRequired !== undefined) updateData.minStaffRequired = minStaffRequired
    if (maxStaffAllowed !== undefined) updateData.maxStaffAllowed = maxStaffAllowed
    if (isActive !== undefined) updateData.isActive = isActive

    const shift = await prisma.shiftDefinition.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: 'Failed to update shift definition' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/shifts/[id] - Delete a shift definition
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to delete shift definitions' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.shiftDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scheduleEntries: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for existing schedule entries
    if (existing._count.scheduleEntries > 0) {
      return NextResponse.json(
        { error: `Cannot delete shift with ${existing._count.scheduleEntries} schedule entries. Deactivate instead.` },
        { status: 400 }
      )
    }

    await prisma.shiftDefinition.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json(
      { error: 'Failed to delete shift definition' },
      { status: 500 }
    )
  }
}
