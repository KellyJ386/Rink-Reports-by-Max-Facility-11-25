import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/settings - Get facility and settings
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
      include: {
        settings: true,
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    return NextResponse.json({
      facility: {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        city: facility.city,
        state: facility.state,
        zipCode: facility.zipCode,
        country: facility.country,
        timezone: facility.timezone,
      },
      settings: facility.settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings - Update facility and settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { facility: facilityData, settings: settingsData } = body

    // Update facility info
    if (facilityData) {
      // Validate input lengths
      if (facilityData.name && facilityData.name.length > 255) {
        return NextResponse.json({ error: 'Facility name must be 255 characters or less' }, { status: 400 })
      }
      if (facilityData.address && facilityData.address.length > 500) {
        return NextResponse.json({ error: 'Address must be 500 characters or less' }, { status: 400 })
      }
      if (facilityData.city && facilityData.city.length > 100) {
        return NextResponse.json({ error: 'City must be 100 characters or less' }, { status: 400 })
      }
      if (facilityData.state && facilityData.state.length > 100) {
        return NextResponse.json({ error: 'State must be 100 characters or less' }, { status: 400 })
      }
      if (facilityData.zipCode && facilityData.zipCode.length > 20) {
        return NextResponse.json({ error: 'Zip code must be 20 characters or less' }, { status: 400 })
      }

      await prisma.facility.update({
        where: { id: user.facilityId },
        data: {
          name: facilityData.name,
          address: facilityData.address,
          city: facilityData.city,
          state: facilityData.state,
          zipCode: facilityData.zipCode,
          country: facilityData.country,
          timezone: facilityData.timezone,
        },
      })
    }

    // Update or create settings
    if (settingsData) {
      // Validate air quality thresholds
      if (settingsData.coWarningPpm !== undefined && settingsData.coEvacuationPpm !== undefined) {
        if (settingsData.coWarningPpm >= settingsData.coEvacuationPpm) {
          return NextResponse.json({ error: 'CO warning threshold must be less than evacuation threshold' }, { status: 400 })
        }
      }
      if (settingsData.no2WarningPpm !== undefined && settingsData.no2EvacuationPpm !== undefined) {
        if (settingsData.no2WarningPpm >= settingsData.no2EvacuationPpm) {
          return NextResponse.json({ error: 'NO2 warning threshold must be less than evacuation threshold' }, { status: 400 })
        }
      }

      // Validate SMS quiet hours format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
      if (settingsData.smsQuietHoursStart && !timeRegex.test(settingsData.smsQuietHoursStart)) {
        return NextResponse.json({ error: 'Invalid quiet hours start time format. Use HH:MM.' }, { status: 400 })
      }
      if (settingsData.smsQuietHoursEnd && !timeRegex.test(settingsData.smsQuietHoursEnd)) {
        return NextResponse.json({ error: 'Invalid quiet hours end time format. Use HH:MM.' }, { status: 400 })
      }

      await prisma.facilitySettings.upsert({
        where: { facilityId: user.facilityId },
        update: {
          iceDepthRetention: settingsData.iceDepthRetention,
          iceOpsRetention: settingsData.iceOpsRetention,
          refrigerationRetention: settingsData.refrigerationRetention,
          airQualityRetention: settingsData.airQualityRetention,
          incidentRetention: settingsData.incidentRetention,
          scheduleRetention: settingsData.scheduleRetention,
          checklistRetention: settingsData.checklistRetention,
          coWarningPpm: settingsData.coWarningPpm,
          coEvacuationPpm: settingsData.coEvacuationPpm,
          no2WarningPpm: settingsData.no2WarningPpm,
          no2EvacuationPpm: settingsData.no2EvacuationPpm,
          enableAirQualityAlerts: settingsData.enableAirQualityAlerts,
          smsEnabled: settingsData.smsEnabled,
          smsProvider: settingsData.smsProvider,
          smsFromNumber: settingsData.smsFromNumber,
          smsQuietHoursStart: settingsData.smsQuietHoursStart,
          smsQuietHoursEnd: settingsData.smsQuietHoursEnd,
          smsCriticalOverride: settingsData.smsCriticalOverride,
        },
        create: {
          facilityId: user.facilityId,
          iceDepthRetention: settingsData.iceDepthRetention ?? 1095,
          iceOpsRetention: settingsData.iceOpsRetention ?? 1095,
          refrigerationRetention: settingsData.refrigerationRetention ?? 1095,
          airQualityRetention: settingsData.airQualityRetention ?? 1095,
          incidentRetention: settingsData.incidentRetention ?? 2555,
          scheduleRetention: settingsData.scheduleRetention ?? 1095,
          checklistRetention: settingsData.checklistRetention ?? 1095,
          coWarningPpm: settingsData.coWarningPpm ?? 20,
          coEvacuationPpm: settingsData.coEvacuationPpm ?? 83,
          no2WarningPpm: settingsData.no2WarningPpm ?? 0.3,
          no2EvacuationPpm: settingsData.no2EvacuationPpm ?? 2.0,
          enableAirQualityAlerts: settingsData.enableAirQualityAlerts ?? true,
          smsEnabled: settingsData.smsEnabled ?? false,
          smsProvider: settingsData.smsProvider,
          smsFromNumber: settingsData.smsFromNumber,
          smsQuietHoursStart: settingsData.smsQuietHoursStart,
          smsQuietHoursEnd: settingsData.smsQuietHoursEnd,
          smsCriticalOverride: settingsData.smsCriticalOverride ?? true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
