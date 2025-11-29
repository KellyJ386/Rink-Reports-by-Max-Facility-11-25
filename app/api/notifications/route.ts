import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Mock notifications - in production, use Prisma
const mockNotifications = [
  {
    id: '1',
    type: 'INCIDENT_SUBMITTED',
    title: 'New Incident Report',
    message: 'A new incident report has been submitted for Rink A and requires review.',
    relatedEntityType: 'Submission',
    relatedEntityId: 'sub-1',
    isRead: false,
    sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    emailSent: true,
  },
  {
    id: '2',
    type: 'SCHEDULE_PUBLISHED',
    title: 'Schedule Published',
    message: 'The schedule for next week has been published.',
    relatedEntityType: 'Schedule',
    relatedEntityId: 'sched-1',
    isRead: false,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    emailSent: true,
  },
  {
    id: '3',
    type: 'SHIFT_OPEN',
    title: 'Open Shift Available',
    message: 'An open shift is available for tomorrow morning (6:00 AM - 2:00 PM).',
    relatedEntityType: 'ScheduleEntry',
    relatedEntityId: 'entry-1',
    isRead: true,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    emailSent: true,
  },
  {
    id: '4',
    type: 'REPORT_REMINDER',
    title: 'Daily Report Reminder',
    message: 'Don\'t forget to submit your daily ice operations report.',
    relatedEntityType: null,
    relatedEntityId: null,
    isRead: true,
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    emailSent: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let notifications = [...mockNotifications]

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead)
    }

    notifications = notifications.slice(0, limit)

    const unreadCount = mockNotifications.filter(n => !n.isRead).length

    return NextResponse.json({
      notifications,
      unreadCount,
      total: mockNotifications.length,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, recipientUserId, recipientRoleId, relatedEntityType, relatedEntityId } = body

    // In production, create notification in database
    const notification = {
      id: `notif-${Date.now()}`,
      facilityId: user.facilityId,
      recipientUserId,
      recipientRoleId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      isRead: false,
      sentAt: new Date().toISOString(),
      emailSent: false,
    }

    // TODO: Send email notification if user preferences allow
    // TODO: Send SMS if critical and user has SMS enabled

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
