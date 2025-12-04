import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  Notification,
  NotificationStatus,
  NotificationCategory,
  NotificationPriority,
  CreateNotificationInput,
  NOTIFICATION_TEMPLATES,
} from '@/types/notifications'
import { renderTemplate } from '@/lib/notifications'

// In-memory storage for demo (replace with database in production)
const notifications = new Map<string, Notification>()

// Initialize with sample data
function initSampleData() {
  if (notifications.size === 0) {
    const sampleNotifications: Notification[] = [
      {
        id: 'notif-1',
        type: 'SHIFT_ASSIGNED',
        category: 'SCHEDULE',
        priority: 'NORMAL',
        status: 'UNREAD',
        title: 'New Shift Assignment',
        message: 'You have been assigned to Morning Shift on December 5th',
        recipientId: 'user-1',
        recipientType: 'USER',
        channels: ['IN_APP', 'EMAIL'],
        actionUrl: '/dashboard/schedule/my-schedule',
        actionLabel: 'View Schedule',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-2',
        type: 'AIR_QUALITY_WARNING',
        category: 'AIR_QUALITY',
        priority: 'HIGH',
        status: 'UNREAD',
        title: 'Air Quality Warning',
        message: 'CO levels elevated at Main Rink: 28 ppm (threshold: 25 ppm)',
        recipientId: 'user-1',
        recipientType: 'USER',
        channels: ['IN_APP', 'EMAIL', 'SMS'],
        actionUrl: '/dashboard/air-quality',
        actionLabel: 'View Details',
        data: {
          facilityName: 'Main Facility',
          airQualityLevel: 28,
          threshold: 25,
          metadata: { gasType: 'CO' },
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-3',
        type: 'INCIDENT_SUBMITTED',
        category: 'INCIDENTS',
        priority: 'HIGH',
        status: 'UNREAD',
        title: 'New Incident Report',
        message: 'John Smith submitted an incident report at Main Facility',
        recipientId: 'user-1',
        recipientType: 'USER',
        channels: ['IN_APP', 'EMAIL'],
        actionUrl: '/dashboard/incidents/inc-123',
        actionLabel: 'View Incident',
        data: {
          entityType: 'INCIDENT',
          entityId: 'inc-123',
          facilityName: 'Main Facility',
          submittedBy: { id: 'emp-1', name: 'John Smith' },
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-4',
        type: 'SCHEDULE_PUBLISHED',
        category: 'SCHEDULE',
        priority: 'NORMAL',
        status: 'READ',
        title: 'New Schedule Published',
        message: 'The schedule for December Week 1 has been published. You have 5 shifts.',
        recipientId: 'user-1',
        recipientType: 'USER',
        channels: ['IN_APP', 'EMAIL'],
        actionUrl: '/dashboard/schedule/my-schedule',
        actionLabel: 'View Schedule',
        readAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-5',
        type: 'SHIFT_SWAP_REQUESTED',
        category: 'SCHEDULE',
        priority: 'NORMAL',
        status: 'READ',
        title: 'Shift Swap Request',
        message: 'Sarah Johnson wants to swap shifts with you',
        recipientId: 'user-1',
        recipientType: 'USER',
        channels: ['IN_APP', 'EMAIL'],
        actionUrl: '/dashboard/schedule/my-schedule?tab=swaps',
        actionLabel: 'Review Request',
        readAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif-6',
        type: 'SYSTEM_ANNOUNCEMENT',
        category: 'SYSTEM',
        priority: 'LOW',
        status: 'ARCHIVED',
        title: 'System Maintenance',
        message: 'Scheduled maintenance completed successfully. All systems are operational.',
        recipientId: 'user-1',
        recipientType: 'USER',
        channels: ['IN_APP'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    sampleNotifications.forEach((n) => notifications.set(n.id, n))
  }
}

// GET /api/notifications - List notifications with filters
export async function GET(request: NextRequest) {
  try {
    initSampleData()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as NotificationStatus | null
    const category = searchParams.get('category') as NotificationCategory | null
    const priority = searchParams.get('priority') as NotificationPriority | null
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let results = Array.from(notifications.values())

    // Filter by user
    if (userId) {
      results = results.filter(
        (n) => n.recipientId === userId || n.recipientId === 'all'
      )
    }

    // Apply filters
    if (status) {
      results = results.filter((n) => n.status === status)
    }
    if (category) {
      results = results.filter((n) => n.category === category)
    }
    if (priority) {
      results = results.filter((n) => n.priority === priority)
    }
    if (unreadOnly) {
      results = results.filter((n) => n.status === 'UNREAD')
    }

    // Sort by created date descending
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Calculate unread count
    const unreadCount = results.filter((n) => n.status === 'UNREAD').length

    return NextResponse.json({
      notifications: results,
      total: results.length,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    initSampleData()

    const body: CreateNotificationInput & { recipientId?: string } = await request.json()

    // Validate required fields
    if (!body.type) {
      return NextResponse.json(
        { error: 'Notification type is required' },
        { status: 400 }
      )
    }

    const template = NOTIFICATION_TEMPLATES[body.type]
    if (!template) {
      return NextResponse.json(
        { error: `Unknown notification type: ${body.type}` },
        { status: 400 }
      )
    }

    // Build template data
    const templateData = {
      ...body.data,
      ...body.data?.metadata,
    } as Record<string, unknown>

    // Render title and message
    const title = body.customTitle || renderTemplate(template.titleTemplate, templateData)
    const message = body.customMessage || renderTemplate(template.messageTemplate, templateData)

    // Render action URL
    const actionUrl = body.actionUrl ||
      (template.defaultActionUrl ? renderTemplate(template.defaultActionUrl, templateData) : undefined)

    const newNotification: Notification = {
      id: uuidv4(),
      type: body.type,
      category: template.category,
      priority: body.priority || template.defaultPriority,
      status: 'UNREAD',
      title,
      message,
      data: body.data,
      recipientId: body.recipientId || 'user-1',
      recipientType: body.recipientType || 'USER',
      channels: body.channels || template.defaultChannels,
      actionUrl,
      actionLabel: body.actionLabel || template.defaultActionLabel,
      expiresAt: body.expiresAt,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    notifications.set(newNotification.id, newNotification)

    return NextResponse.json(newNotification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
