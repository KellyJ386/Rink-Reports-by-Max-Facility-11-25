import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/settings/notifications - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's notification preferences from metadata or defaults
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metadata: true },
    })

    const metadata = (userData?.metadata as Record<string, any>) || {}
    const preferences = metadata.notificationPreferences || {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      schedulePublished: true,
      shiftReminder: true,
      shiftReminderHours: 24,
      openShifts: true,
      emergencyShifts: true,
      timeOffUpdates: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/settings/notifications - Update notification preferences
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences required' },
        { status: 400 }
      )
    }

    // Get current metadata
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metadata: true },
    })

    const currentMetadata = (userData?.metadata as Record<string, any>) || {}

    // Update user metadata with notification preferences
    await prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...currentMetadata,
          notificationPreferences: {
            emailEnabled: preferences.emailEnabled ?? true,
            smsEnabled: preferences.smsEnabled ?? false,
            pushEnabled: preferences.pushEnabled ?? true,
            schedulePublished: preferences.schedulePublished ?? true,
            shiftReminder: preferences.shiftReminder ?? true,
            shiftReminderHours: preferences.shiftReminderHours ?? 24,
            openShifts: preferences.openShifts ?? true,
            emergencyShifts: preferences.emergencyShifts ?? true,
            timeOffUpdates: preferences.timeOffUpdates ?? true,
            quietHoursEnabled: preferences.quietHoursEnabled ?? false,
            quietHoursStart: preferences.quietHoursStart ?? '22:00',
            quietHoursEnd: preferences.quietHoursEnd ?? '07:00',
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Preferences updated',
      preferences,
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
