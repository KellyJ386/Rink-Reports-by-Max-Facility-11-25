import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/settings - Get facility settings
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: user.facilityId },
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.facilitySettings.create({
        data: {
          facilityId: user.facilityId,
        },
      })
    }

    // Get facility info
    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
    })

    return NextResponse.json({ settings, facility })
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

    const canManageSettings = canUserAccess(user, 'admin', 'manageSettings')
    if (!canManageSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      // Facility info
      facilityName,
      facilityAddress,
      facilityCity,
      facilityState,
      facilityZipCode,
      facilityTimezone,
      // Retention settings
      iceDepthRetention,
      iceOpsRetention,
      refrigerationRetention,
      airQualityRetention,
      incidentRetention,
      scheduleRetention,
      checklistRetention,
      // Air quality thresholds
      coWarningPpm,
      coEvacuationPpm,
      no2WarningPpm,
      no2EvacuationPpm,
      enableAirQualityAlerts,
      // SMS settings
      smsEnabled,
      smsProvider,
      smsFromNumber,
      smsQuietHoursStart,
      smsQuietHoursEnd,
      smsCriticalOverride,
    } = body

    // Update facility info if provided
    if (facilityName || facilityAddress || facilityCity || facilityState || facilityZipCode || facilityTimezone) {
      const facilityUpdate: Record<string, string> = {}
      if (facilityName) facilityUpdate.name = facilityName
      if (facilityAddress) facilityUpdate.address = facilityAddress
      if (facilityCity) facilityUpdate.city = facilityCity
      if (facilityState) facilityUpdate.state = facilityState
      if (facilityZipCode) facilityUpdate.zipCode = facilityZipCode
      if (facilityTimezone) facilityUpdate.timezone = facilityTimezone

      await prisma.facility.update({
        where: { id: user.facilityId },
        data: facilityUpdate,
      })
    }

    // Build settings update data
    const settingsUpdate: Record<string, unknown> = {}

    // Retention settings
    if (iceDepthRetention !== undefined) settingsUpdate.iceDepthRetention = iceDepthRetention
    if (iceOpsRetention !== undefined) settingsUpdate.iceOpsRetention = iceOpsRetention
    if (refrigerationRetention !== undefined) settingsUpdate.refrigerationRetention = refrigerationRetention
    if (airQualityRetention !== undefined) settingsUpdate.airQualityRetention = airQualityRetention
    if (incidentRetention !== undefined) settingsUpdate.incidentRetention = incidentRetention
    if (scheduleRetention !== undefined) settingsUpdate.scheduleRetention = scheduleRetention
    if (checklistRetention !== undefined) settingsUpdate.checklistRetention = checklistRetention

    // Air quality thresholds
    if (coWarningPpm !== undefined) settingsUpdate.coWarningPpm = coWarningPpm
    if (coEvacuationPpm !== undefined) settingsUpdate.coEvacuationPpm = coEvacuationPpm
    if (no2WarningPpm !== undefined) settingsUpdate.no2WarningPpm = no2WarningPpm
    if (no2EvacuationPpm !== undefined) settingsUpdate.no2EvacuationPpm = no2EvacuationPpm
    if (enableAirQualityAlerts !== undefined) settingsUpdate.enableAirQualityAlerts = enableAirQualityAlerts

    // SMS settings
    if (smsEnabled !== undefined) settingsUpdate.smsEnabled = smsEnabled
    if (smsProvider !== undefined) settingsUpdate.smsProvider = smsProvider
    if (smsFromNumber !== undefined) settingsUpdate.smsFromNumber = smsFromNumber
    if (smsQuietHoursStart !== undefined) settingsUpdate.smsQuietHoursStart = smsQuietHoursStart
    if (smsQuietHoursEnd !== undefined) settingsUpdate.smsQuietHoursEnd = smsQuietHoursEnd
    if (smsCriticalOverride !== undefined) settingsUpdate.smsCriticalOverride = smsCriticalOverride

    const settings = await prisma.facilitySettings.upsert({
      where: { facilityId: user.facilityId },
      update: settingsUpdate,
      create: {
        facilityId: user.facilityId,
        ...settingsUpdate,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FacilitySettings',
        entityId: settings.id,
        newValue: settingsUpdate,
      },
    })

    const facility = await prisma.facility.findUnique({
      where: { id: user.facilityId },
    })

    return NextResponse.json({ settings, facility })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
