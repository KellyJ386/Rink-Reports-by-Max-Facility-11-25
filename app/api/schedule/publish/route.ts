import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// POST /api/schedule/publish - Bulk publish schedule entries
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'publish')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, startDate, endDate } = body

    let entriesToPublish: { id: string }[] = []

    // If specific IDs provided, use those
    if (ids && Array.isArray(ids) && ids.length > 0) {
      entriesToPublish = await prisma.scheduleEntry.findMany({
        where: {
          id: { in: ids },
          status: 'DRAFT',
          user: {
            facilityId: user.facilityId,
          },
        },
        select: { id: true },
      })
    }
    // Otherwise, use date range
    else if (startDate && endDate) {
      entriesToPublish = await prisma.scheduleEntry.findMany({
        where: {
          status: 'DRAFT',
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          user: {
            facilityId: user.facilityId,
          },
        },
        select: { id: true },
      })
    } else {
      return NextResponse.json(
        { error: 'Either ids array or startDate/endDate range is required' },
        { status: 400 }
      )
    }

    if (entriesToPublish.length === 0) {
      return NextResponse.json(
        { message: 'No draft entries found to publish', count: 0 },
        { status: 200 }
      )
    }

    const entryIds = entriesToPublish.map(e => e.id)

    // Bulk update to PUBLISHED
    await prisma.scheduleEntry.updateMany({
      where: {
        id: { in: entryIds },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: user.id,
      },
    })

    // Get the published entries with user info for notifications
    const publishedEntries = await prisma.scheduleEntry.findMany({
      where: {
        id: { in: entryIds },
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

    // Create notifications for each entry
    const notifications = []
    for (const entry of publishedEntries) {
      if (!entry.isOpenShift) {
        // Notification for assigned user
        notifications.push({
          facilityId: user.facilityId,
          recipientUserId: entry.userId,
          type: 'SCHEDULE_PUBLISHED' as const,
          title: 'Schedule Published',
          message: `Your schedule for ${entry.date.toLocaleDateString()} has been published. Shift: ${entry.startTime} - ${entry.endTime}`,
          relatedEntityType: 'ScheduleEntry',
          relatedEntityId: entry.id,
        })
      } else {
        // Broadcast for open shifts
        const notificationType = entry.isEmergency ? 'SHIFT_EMERGENCY' : 'SHIFT_OPEN'
        const title = entry.isEmergency ? 'Emergency Coverage Needed' : 'Open Shift Available'

        notifications.push({
          facilityId: user.facilityId,
          type: notificationType as 'SHIFT_EMERGENCY' | 'SHIFT_OPEN',
          title,
          message: `${entry.isEmergency ? 'URGENT: ' : ''}Open shift available on ${entry.date.toLocaleDateString()} from ${entry.startTime} - ${entry.endTime}`,
          relatedEntityType: 'ScheduleEntry',
          relatedEntityId: entry.id,
        })
      }
    }

    // Bulk create notifications
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      })
    }

    return NextResponse.json({
      message: `Successfully published ${publishedEntries.length} schedule entries`,
      count: publishedEntries.length,
      entries: publishedEntries,
    })
  } catch (error) {
    console.error('Bulk publish error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
