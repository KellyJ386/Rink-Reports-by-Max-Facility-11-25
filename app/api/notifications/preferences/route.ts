import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notifications'

// In-memory storage for preferences
const preferences = new Map<string, NotificationPreferences>()

// GET /api/notifications/preferences - Get user notification preferences
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

    let userPrefs = preferences.get(userId)

    if (!userPrefs) {
      // Create default preferences
      userPrefs = {
        id: uuidv4(),
        userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      preferences.set(userId, userPrefs)
    }

    return NextResponse.json(userPrefs)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const body: NotificationPreferences = await request.json()

    if (!body.userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const existing = preferences.get(body.userId)

    const updatedPrefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...existing,
      ...body,
      id: existing?.id || body.id || uuidv4(),
      userId: body.userId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    preferences.set(body.userId, updatedPrefs)

    return NextResponse.json(updatedPrefs)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}

// POST /api/notifications/preferences - Create notification preferences (alias for PUT)
export async function POST(request: NextRequest) {
  return PUT(request)
}
