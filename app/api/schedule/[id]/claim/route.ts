import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { ScheduleBroadcast } from '@/lib/realtime'

// POST /api/schedule/[id]/claim - Claim an open shift
export async function POST(
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

    // Verify schedule entry exists and is an open shift
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

    // Verify user is in the same facility
    if (existingEntry.user.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Must be an open shift
    if (!existingEntry.isOpenShift) {
      return NextResponse.json(
        { error: 'This shift is not available for claiming' },
        { status: 400 }
      )
    }

    // Must be published
    if (existingEntry.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This shift is not yet available for claiming' },
        { status: 400 }
      )
    }

    // Check if user is already on the waitlist
    const waitlistUsers = (existingEntry.waitlistUsers as string[]) || []
    if (waitlistUsers.includes(user.id)) {
      return NextResponse.json(
        { error: 'You are already on the waitlist for this shift' },
        { status: 400 }
      )
    }

    // Check for conflicting shifts on the same date
    const conflictingShift = await prisma.scheduleEntry.findFirst({
      where: {
        userId: user.id,
        date: existingEntry.date,
        status: { in: ['DRAFT', 'PUBLISHED', 'FILLED'] },
        id: { not: existingEntry.id },
        OR: [
          {
            // New shift starts during existing shift
            AND: [
              { startTime: { lte: existingEntry.startTime } },
              { endTime: { gt: existingEntry.startTime } },
            ],
          },
          {
            // New shift ends during existing shift
            AND: [
              { startTime: { lt: existingEntry.endTime } },
              { endTime: { gte: existingEntry.endTime } },
            ],
          },
          {
            // New shift completely contains existing shift
            AND: [
              { startTime: { gte: existingEntry.startTime } },
              { endTime: { lte: existingEntry.endTime } },
            ],
          },
        ],
      },
    })

    if (conflictingShift) {
      return NextResponse.json(
        { error: 'You have a conflicting shift on this date' },
        { status: 400 }
      )
    }

    // If waitlist is empty, assign the shift directly
    if (waitlistUsers.length === 0) {
      const claimedEntry = await prisma.scheduleEntry.update({
        where: { id },
        data: {
          userId: user.id,
          isOpenShift: false,
          status: 'FILLED',
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

      // Notify the user who claimed it
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientUserId: user.id,
          type: 'SCHEDULE_PUBLISHED',
          title: 'Shift Claimed',
          message: `You have successfully claimed the shift on ${claimedEntry.date.toLocaleDateString()} from ${claimedEntry.startTime} - ${claimedEntry.endTime}`,
          relatedEntityType: 'ScheduleEntry',
          relatedEntityId: claimedEntry.id,
        },
      })

      // Broadcast real-time update for claimed shift
      await ScheduleBroadcast.shiftClaimed(user.facilityId, claimedEntry, user.id)

      return NextResponse.json({
        scheduleEntry: claimedEntry,
        message: 'Shift claimed successfully',
      })
    }

    // Otherwise, add to waitlist
    const updatedWaitlist = [...waitlistUsers, user.id]

    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        waitlistUsers: updatedWaitlist,
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

    // Broadcast waitlist update
    await ScheduleBroadcast.updated(user.facilityId, updatedEntry)

    return NextResponse.json({
      scheduleEntry: updatedEntry,
      message: `Added to waitlist. Position: ${updatedWaitlist.length}`,
      waitlistPosition: updatedWaitlist.length,
    })
  } catch (error) {
    console.error('Claim shift error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/[id]/claim - Remove self from waitlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

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

    if (existingEntry.user.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const waitlistUsers = (existingEntry.waitlistUsers as string[]) || []
    const updatedWaitlist = waitlistUsers.filter(uid => uid !== user.id)

    await prisma.scheduleEntry.update({
      where: { id },
      data: {
        waitlistUsers: updatedWaitlist,
      },
    })

    return NextResponse.json({ message: 'Removed from waitlist' })
  } catch (error) {
    console.error('Remove from waitlist error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
