import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { ScheduleBroadcast } from '@/lib/realtime'

// GET /api/schedule/[id] - Get a specific schedule entry
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

    const scheduleEntry = await prisma.scheduleEntry.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facilityId: true,
          },
        },
      },
    })

    if (!scheduleEntry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // Verify user has access (same facility)
    if (scheduleEntry.user.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can view this entry
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll && scheduleEntry.userId !== user.id && !scheduleEntry.isOpenShift) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ scheduleEntry })
  } catch (error) {
    console.error('Get schedule entry error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT /api/schedule/[id] - Update a schedule entry
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
    const {
      userId: assignedUserId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift,
      isEmergency,
      status,
      waitlistUsers,
    } = body

    // Verify schedule entry exists
    const existingEntry = await prisma.scheduleEntry.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            facilityId: true,
          },
        },
      },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // Verify user has access (same facility)
    if (existingEntry.user.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Cannot modify published entries without publish permission
    if (existingEntry.status === 'PUBLISHED' && !canUserAccess(user, 'schedule', 'publish')) {
      return NextResponse.json(
        { error: 'Cannot modify published schedule entries' },
        { status: 403 }
      )
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

    // If userId provided, verify they belong to the same facility
    if (assignedUserId) {
      const assignedUser = await prisma.user.findFirst({
        where: {
          id: assignedUserId,
          facilityId: user.facilityId,
          isActive: true,
        },
      })

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Invalid user' },
          { status: 400 }
        )
      }
    }

    // If shiftId provided, verify it belongs to the facility
    if (shiftId) {
      const shift = await prisma.shiftDefinition.findFirst({
        where: {
          id: shiftId,
          facilityId: user.facilityId,
        },
      })

      if (!shift) {
        return NextResponse.json(
          { error: 'Invalid shift' },
          { status: 400 }
        )
      }
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

    // Status changes require publish permission
    if (status && status !== existingEntry.status) {
      if (status === 'PUBLISHED' && !canUserAccess(user, 'schedule', 'publish')) {
        return NextResponse.json(
          { error: 'Permission denied to publish' },
          { status: 403 }
        )
      }
    }

    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        ...(assignedUserId !== undefined && { userId: assignedUserId }),
        ...(shiftId !== undefined && { shiftId: shiftId || null }),
        ...(rinkId !== undefined && { rinkId: rinkId || null }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(isOpenShift !== undefined && { isOpenShift }),
        ...(isEmergency !== undefined && { isEmergency }),
        ...(status !== undefined && { status }),
        ...(waitlistUsers !== undefined && { waitlistUsers }),
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
    })

    // Broadcast real-time update
    await ScheduleBroadcast.updated(user.facilityId, updatedEntry)

    return NextResponse.json({ scheduleEntry: updatedEntry })
  } catch (error) {
    console.error('Update schedule entry error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/[id] - Delete a schedule entry
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

    // Verify schedule entry exists
    const existingEntry = await prisma.scheduleEntry.findFirst({
      where: { id },
      include: {
        user: {
          select: {
            facilityId: true,
          },
        },
      },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // Verify user has access (same facility)
    if (existingEntry.user.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Cannot delete published entries without publish permission
    if (existingEntry.status === 'PUBLISHED' && !canUserAccess(user, 'schedule', 'publish')) {
      return NextResponse.json(
        { error: 'Cannot delete published schedule entries' },
        { status: 403 }
      )
    }

    // Mark as cancelled instead of hard delete (to preserve history)
    await prisma.scheduleEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    // Broadcast real-time update
    await ScheduleBroadcast.deleted(user.facilityId, id)

    return NextResponse.json({ message: 'Schedule entry deleted successfully' })
  } catch (error) {
    console.error('Delete schedule entry error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
