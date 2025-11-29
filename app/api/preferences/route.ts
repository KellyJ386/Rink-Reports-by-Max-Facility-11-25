import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Default notification preferences
const defaultPreferences = {
  email: {
    enabled: true,
    incidentSubmitted: true,
    incidentReviewed: true,
    schedulePublished: true,
    shiftReminder: true,
    openShiftAvailable: true,
    reportReminder: true,
    systemAnnouncements: true,
  },
  sms: {
    enabled: false,
    preference: 'CRITICAL_ONLY', // ALL, CRITICAL_ONLY, NONE
    incidentAmbulance: true,
    airQualityEvacuation: true,
    emergencyShift: true,
  },
  push: {
    enabled: false,
    incidentSubmitted: true,
    scheduleChanges: true,
    shiftReminder: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    overrideForCritical: true,
  },
}

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production, fetch user preferences from database
    // Merge with defaults for any missing settings
    const preferences = {
      ...defaultPreferences,
      userId: user.id,
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate SMS settings
    if (body.sms?.enabled && !body.sms?.phoneVerified) {
      // In production, trigger phone verification flow
    }

    // In production, update user preferences in database
    const preferences = {
      userId: user.id,
      email: { ...defaultPreferences.email, ...body.email },
      sms: { ...defaultPreferences.sms, ...body.sms },
      push: { ...defaultPreferences.push, ...body.push },
      quietHours: { ...defaultPreferences.quietHours, ...body.quietHours },
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
