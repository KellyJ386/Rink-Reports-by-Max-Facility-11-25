import { NextRequest, NextResponse } from 'next/server'
import {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationStats,
} from '@/types/notifications'

// In-memory storage reference
const notifications = new Map<string, Notification>()

// GET /api/notifications/stats - Get notification statistics for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Filter notifications for this user
    const userNotifications = Array.from(notifications.values()).filter(
      (n) => n.recipientId === userId || n.recipientId === 'all'
    )

    // Calculate stats
    const stats: NotificationStats = {
      total: userNotifications.length,
      unread: userNotifications.filter((n) => n.status === 'UNREAD').length,
      byCategory: {
        SCHEDULE: 0,
        INCIDENTS: 0,
        AIR_QUALITY: 0,
        REPORTS: 0,
        SYSTEM: 0,
        ADMIN: 0,
      },
      byPriority: {
        LOW: 0,
        NORMAL: 0,
        HIGH: 0,
        URGENT: 0,
      },
    }

    userNotifications.forEach((notification) => {
      stats.byCategory[notification.category]++
      stats.byPriority[notification.priority]++
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification stats' },
      { status: 500 }
    )
  }
}
