import { NextRequest, NextResponse } from 'next/server'
import { Notification } from '@/types/notifications'

// In-memory storage reference
const notifications = new Map<string, Notification>()

// POST /api/notifications/[id]/archive - Archive a notification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notification = notifications.get(id)

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updatedNotification: Notification = {
      ...notification,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    }

    notifications.set(id, updatedNotification)

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Error archiving notification:', error)
    return NextResponse.json(
      { error: 'Failed to archive notification' },
      { status: 500 }
    )
  }
}
