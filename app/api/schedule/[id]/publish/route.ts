import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { ScheduleBroadcast } from '@/lib/realtime'

// POST /api/schedule/[id]/publish - Publish a schedule entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'publish')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

    // Verify schedule entry exists
    const existingEntry = await prisma.scheduleEntry.findFirst({
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

    if (!existingEntry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // Verify user has access (same facility)
    if (existingEntry.user.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Can only publish DRAFT entries
    if (existingEntry.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot publish entry with status: ${existingEntry.status}` },
        { status: 400 }
      )
    }

    // Publish the entry
    const publishedEntry = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: user.id,
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

    // Create notification for assigned user (if not an open shift)
    if (!publishedEntry.isOpenShift) {
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientUserId: publishedEntry.userId,
          type: 'SCHEDULE_PUBLISHED',
          title: 'Schedule Published',
          message: `Your schedule for ${publishedEntry.date.toLocaleDateString()} has been published. Shift: ${publishedEntry.startTime} - ${publishedEntry.endTime}`,
          relatedEntityType: 'ScheduleEntry',
          relatedEntityId: publishedEntry.id,
        },
      })
    }

    // If it's an open shift, create notification for relevant role
    if (publishedEntry.isOpenShift) {
      const notificationType = publishedEntry.isEmergency ? 'SHIFT_EMERGENCY' : 'SHIFT_OPEN'
      const title = publishedEntry.isEmergency ? 'Emergency Coverage Needed' : 'Open Shift Available'

      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          type: notificationType,
          title,
          message: `${publishedEntry.isEmergency ? 'URGENT: ' : ''}Open shift available on ${publishedEntry.date.toLocaleDateString()} from ${publishedEntry.startTime} - ${publishedEntry.endTime}`,
          relatedEntityType: 'ScheduleEntry',
          relatedEntityId: publishedEntry.id,
        },
      })

      // Broadcast real-time update for open/emergency shifts
      if (publishedEntry.isEmergency) {
        await ScheduleBroadcast.emergencyShift(user.facilityId, publishedEntry)
      } else {
        await ScheduleBroadcast.openShift(user.facilityId, publishedEntry)
      }
    }

    // Broadcast schedule update
    await ScheduleBroadcast.updated(user.facilityId, publishedEntry)

    return NextResponse.json({ scheduleEntry: publishedEntry })
  } catch (error) {
    console.error('Publish schedule entry error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
