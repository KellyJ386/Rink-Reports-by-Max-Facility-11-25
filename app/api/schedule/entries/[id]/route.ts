import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { validateScheduleEntry, detectConflicts, formatDateToISO } from '@/lib/schedule'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/schedule/entries/[id] - Get a single schedule entry
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

    const entry = await prisma.scheduleEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        shift: true,
        rink: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    if (entry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can only view own schedules
    if (!permissions.schedule?.viewAll && permissions.schedule?.viewOwn) {
      if (entry.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error fetching schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule entry' },
      { status: 500 }
    )
  }
}

// PUT /api/schedule/entries/[id] - Update a schedule entry
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to edit schedule entries' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Cannot edit published entries without special permission
    if (existing.status === 'PUBLISHED' && !permissions.schedule?.publish) {
      return NextResponse.json(
        { error: 'Cannot modify published schedule entries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      userId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift,
      isEmergency,
      status,
      notes
    } = body

    // Validate if changing date/times
    if (date || startTime || endTime) {
      const validation = validateScheduleEntry({
        date: date || formatDateToISO(existing.date),
        startTime: startTime || existing.startTime,
        endTime: endTime || existing.endTime,
        userId: userId !== undefined ? userId : existing.userId
      })

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        )
      }
    }

    // Check for conflicts if changing assignment or times
    const targetUserId = userId !== undefined ? userId : existing.userId
    if (targetUserId && (userId !== undefined || date || startTime || endTime)) {
      const conflicts = await detectConflicts(
        user.facilityId,
        targetUserId,
        date || formatDateToISO(existing.date),
        startTime || existing.startTime,
        endTime || existing.endTime,
        id // Exclude this entry from conflict check
      )

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Scheduling conflict detected',
            conflicts
          },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}

    if (userId !== undefined) updateData.userId = userId
    if (shiftId !== undefined) updateData.shiftId = shiftId
    if (rinkId !== undefined) updateData.rinkId = rinkId
    if (date !== undefined) updateData.date = new Date(date)
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (isOpenShift !== undefined) updateData.isOpenShift = isOpenShift
    if (isEmergency !== undefined) updateData.isEmergency = isEmergency
    if (notes !== undefined) updateData.notes = notes

    // Handle status changes
    if (status !== undefined) {
      if (status === 'PUBLISHED' && !permissions.schedule?.publish) {
        return NextResponse.json(
          { error: 'You do not have permission to publish schedules' },
          { status: 403 }
        )
      }
      updateData.status = status

      if (status === 'PUBLISHED') {
        updateData.publishedAt = new Date()
        updateData.publishedById = user.id
      }
    }

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        shift: true,
        rink: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/entries/[id] - Cancel/delete a schedule entry
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to delete schedule entries' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // For published entries, cancel instead of delete
    if (existing.status === 'PUBLISHED') {
      await prisma.scheduleEntry.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })
      return NextResponse.json({ success: true, action: 'cancelled' })
    }

    // For draft entries, delete completely
    await prisma.scheduleEntry.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, action: 'deleted' })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule entry' },
      { status: 500 }
    )
  }
}
