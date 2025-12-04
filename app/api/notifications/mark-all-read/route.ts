import { NextRequest, NextResponse } from 'next/server'
import { Notification } from '@/types/notifications'

// In-memory storage reference
const notifications = new Map<string, Notification>()

// POST /api/notifications/mark-all-read - Mark all notifications as read for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    let count = 0
    const now = new Date().toISOString()

    notifications.forEach((notification) => {
      if (
        (notification.recipientId === userId || notification.recipientId === 'all') &&
        notification.status === 'UNREAD'
      ) {
        notification.status = 'READ'
        notification.readAt = now
        notification.updatedAt = now
        count++
      }
    })

    return NextResponse.json({
      success: true,
      markedCount: count,
    })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all as read' },
      { status: 500 }
    )
  }
}
