import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAdminPermission,
  logAdminAction,
  getClientIP,
  getUserAgent,
} from '@/lib/adminAuth'
import {
  updateRetentionSettingsSchema,
  updateAirQualitySettingsSchema,
  updateSmsSettingsSchema,
} from '@/lib/validations/admin'

// GET /api/admin/settings - Get facility settings
export async function GET() {
  try {
    const user = await requireAdminPermission('access')

    let settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: user.facilityId },
    })

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.facilitySettings.create({
        data: {
          facilityId: user.facilityId,
        },
      })
    }

    // Get facility info too
    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        timezone: true,
      },
    })

    return NextResponse.json({
      facility,
      settings: {
        id: settings.id,
        // Retention settings
        iceDepthRetention: settings.iceDepthRetention,
        iceOpsRetention: settings.iceOpsRetention,
        refrigerationRetention: settings.refrigerationRetention,
        airQualityRetention: settings.airQualityRetention,
        incidentRetention: settings.incidentRetention,
        scheduleRetention: settings.scheduleRetention,
        checklistRetention: settings.checklistRetention,
        // Air quality thresholds
        coWarningPpm: settings.coWarningPpm,
        coEvacuationPpm: settings.coEvacuationPpm,
        no2WarningPpm: settings.no2WarningPpm,
        no2EvacuationPpm: settings.no2EvacuationPpm,
        enableAirQualityAlerts: settings.enableAirQualityAlerts,
        // SMS settings
        smsEnabled: settings.smsEnabled,
        smsProvider: settings.smsProvider,
        smsFromNumber: settings.smsFromNumber,
        smsQuietHoursStart: settings.smsQuietHoursStart,
        smsQuietHoursEnd: settings.smsQuietHoursEnd,
        smsCriticalOverride: settings.smsCriticalOverride,
        // Note: We don't expose smsAccountSid and smsAuthToken for security
        hasSmsCredentials: !!(settings.smsAccountSid && settings.smsAuthToken),
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings - Update facility settings
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdminPermission('editSettings')

    const body = await request.json()
    const { section } = body

    let validatedData: Record<string, unknown> = {}

    // Validate based on section
    if (section === 'retention') {
      const validation = updateRetentionSettingsSchema.safeParse(body.data)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      validatedData = validation.data
    } else if (section === 'airQuality') {
      const validation = updateAirQualitySettingsSchema.safeParse(body.data)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      validatedData = validation.data
    } else if (section === 'sms') {
      const validation = updateSmsSettingsSchema.safeParse(body.data)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten() },
          { status: 400 }
        )
      }
      validatedData = validation.data
    } else {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      )
    }

    // Get current settings
    const currentSettings = await prisma.facilitySettings.findUnique({
      where: { facilityId: user.facilityId },
    })

    // Update or create settings
    const updatedSettings = await prisma.facilitySettings.upsert({
      where: { facilityId: user.facilityId },
      create: {
        facilityId: user.facilityId,
        ...validatedData,
      },
      update: validatedData,
    })

    // Log the action
    await logAdminAction(
      user.id,
      'UPDATE',
      'FacilitySettings',
      updatedSettings.id,
      currentSettings ? { section, ...currentSettings } : null,
      { section, ...validatedData },
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
