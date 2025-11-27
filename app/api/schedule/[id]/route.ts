import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/schedule/[id] - Get a specific schedule entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: { facilityId: user.facilityId },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        rink: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching schedule entry:', error)
    return NextResponse.json({ error: 'Failed to fetch schedule entry' }, { status: 500 })
  }
}

// PATCH /api/schedule/[id] - Update a schedule entry (pick up shift, change status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: { facilityId: user.facilityId },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, ...updateData } = body

    // Handle picking up a shift
    if (action === 'pickup') {
      if (!entry.isOpenShift) {
        return NextResponse.json({ error: 'This is not an open shift' }, { status: 400 })
      }
      if (entry.status === 'FILLED') {
        return NextResponse.json({ error: 'This shift has already been filled' }, { status: 400 })
      }

      const updatedEntry = await prisma.scheduleEntry.update({
        where: { id },
        data: {
          userId: user.id,
          isOpenShift: false,
          status: 'FILLED',
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          rink: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true, startTime: true, endTime: true } },
        },
      })

      return NextResponse.json({ entry: updatedEntry, message: 'Shift picked up successfully' })
    }

    // Handle status updates (requires edit permission)
    if (updateData.status) {
      const canEdit = canUserAccess(user, 'schedule', 'edit')
      const isOwner = entry.userId === user.id

      if (!canEdit && !isOwner) {
        return NextResponse.json({ error: 'No permission to update this entry' }, { status: 403 })
      }
    }

    // General update
    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        rink: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    })

    return NextResponse.json({ entry: updatedEntry })
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json({ error: 'Failed to update schedule entry' }, { status: 500 })
  }
}

// DELETE /api/schedule/[id] - Delete a schedule entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: { facilityId: user.facilityId },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // Check permissions - must have delete permission or be the creator
    const canDelete = canUserAccess(user, 'schedule', 'delete')
    const isCreator = entry.createdById === user.id

    if (!canDelete && !isCreator) {
      return NextResponse.json({ error: 'No permission to delete this entry' }, { status: 403 })
    }

    await prisma.scheduleEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Schedule entry deleted' })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json({ error: 'Failed to delete schedule entry' }, { status: 500 })
  }
}
