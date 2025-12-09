import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/settings - Get facility settings
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get facility with settings
    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
      include: {
        settings: true
      }
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // If no settings exist, create default settings
    let settings = facility.settings
    if (!settings) {
      settings = await prisma.facilitySettings.create({
        data: {
          facilityId: user.facilityId
        }
      })
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
        timezone: facility.timezone
      },
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
        smsCriticalOverride: settings.smsCriticalOverride
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update facility settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { facility: facilityData, settings: settingsData } = body

    // Update facility if provided
    if (facilityData) {
      const allowedFacilityFields = ['name', 'address', 'city', 'state', 'zipCode', 'country', 'timezone']
      const facilityUpdate: Record<string, unknown> = {}

      for (const field of allowedFacilityFields) {
        if (facilityData[field] !== undefined) {
          facilityUpdate[field] = facilityData[field]
        }
      }

      if (Object.keys(facilityUpdate).length > 0) {
        await prisma.facility.update({
          where: { id: user.facilityId },
          data: facilityUpdate
        })
      }
    }

    // Update settings if provided
    if (settingsData) {
      const allowedSettingsFields = [
        'iceDepthRetention', 'iceOpsRetention', 'refrigerationRetention',
        'airQualityRetention', 'incidentRetention', 'scheduleRetention', 'checklistRetention',
        'coWarningPpm', 'coEvacuationPpm', 'no2WarningPpm', 'no2EvacuationPpm', 'enableAirQualityAlerts',
        'smsEnabled', 'smsProvider', 'smsAccountSid', 'smsAuthToken', 'smsFromNumber',
        'smsQuietHoursStart', 'smsQuietHoursEnd', 'smsCriticalOverride'
      ]

      const settingsUpdate: Record<string, unknown> = {}

      for (const field of allowedSettingsFields) {
        if (settingsData[field] !== undefined) {
          settingsUpdate[field] = settingsData[field]
        }
      }

      if (Object.keys(settingsUpdate).length > 0) {
        await prisma.facilitySettings.upsert({
          where: { facilityId: user.facilityId },
          update: settingsUpdate,
          create: {
            facilityId: user.facilityId,
            ...settingsUpdate
          }
        })
      }
    }

    // Return updated data
    const updatedFacility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
      include: { settings: true }
    })

    return NextResponse.json({
      facility: {
        id: updatedFacility!.id,
        name: updatedFacility!.name,
        address: updatedFacility!.address,
        city: updatedFacility!.city,
        state: updatedFacility!.state,
        zipCode: updatedFacility!.zipCode,
        country: updatedFacility!.country,
        timezone: updatedFacility!.timezone
      },
      settings: updatedFacility!.settings
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
