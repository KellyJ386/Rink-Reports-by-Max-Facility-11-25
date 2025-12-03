import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/schedule/[id] - Get a single schedule entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const entry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: {
          facilityId: user.facilityId,
        },
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

    if (!entry) {
      return NextResponse.json(
        { error: 'Schedule entry not found' },
        { status: 404 }
      )
    }

    // Check if user can view this entry
    if (
      !canUserAccess(user, 'schedule', 'viewAll') &&
      entry.userId !== user.id &&
      !entry.isOpenShift
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

// PUT /api/schedule/[id] - Update a schedule entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existingEntry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: {
          facilityId: user.facilityId,
        },
      },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Schedule entry not found' },
        { status: 404 }
      )
    }

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
    } = body

    // If publishing, set publishedAt and publishedById
    const isPublishing =
      status === 'PUBLISHED' && existingEntry.status !== 'PUBLISHED'

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        userId: userId ?? existingEntry.userId,
        shiftId: shiftId !== undefined ? shiftId : existingEntry.shiftId,
        rinkId: rinkId !== undefined ? rinkId : existingEntry.rinkId,
        date: date ? new Date(date) : existingEntry.date,
        startTime: startTime ?? existingEntry.startTime,
        endTime: endTime ?? existingEntry.endTime,
        isOpenShift: isOpenShift ?? existingEntry.isOpenShift,
        isEmergency: isEmergency ?? existingEntry.isEmergency,
        status: status ?? existingEntry.status,
        ...(isPublishing && {
          publishedAt: new Date(),
          publishedById: user.id,
        }),
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

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule entry' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingEntry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: {
          facilityId: user.facilityId,
        },
      },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Schedule entry not found' },
        { status: 404 }
      )
    }

    await prisma.scheduleEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule entry' },
      { status: 500 }
    )
  }
}
