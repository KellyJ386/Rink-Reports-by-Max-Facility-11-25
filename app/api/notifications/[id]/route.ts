import { NextRequest, NextResponse } from 'next/server'
import { Notification } from '@/types/notifications'

// In-memory storage reference (shared with parent route)
const notifications = new Map<string, Notification>()

// GET /api/notifications/[id] - Get a single notification
export async function GET(
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

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/[id] - Update a notification
export async function PATCH(
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

    const body = await request.json()

    const updatedNotification: Notification = {
      ...notification,
      ...body,
      id: notification.id,
      createdAt: notification.createdAt,
      updatedAt: new Date().toISOString(),
    }

    notifications.set(id, updatedNotification)

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
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

    notifications.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
