import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/admin/settings - Get facility settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canAccess = await canUserAccess(session.user.id, 'admin', 'access')
    if (!canAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: session.user.facilityId },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/admin/settings - Update facility settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canAccess = await canUserAccess(session.user.id, 'admin', 'edit')
    if (!canAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      iceDepthRetention,
      iceOpsRetention,
      refrigerationRetention,
      airQualityRetention,
      incidentRetention,
      scheduleRetention,
      checklistRetention,
      coWarningPpm,
      coEvacuationPpm,
      no2WarningPpm,
      no2EvacuationPpm,
      enableAirQualityAlerts,
      smsEnabled,
      smsProvider,
    } = body

    const settings = await prisma.facilitySettings.upsert({
      where: { facilityId: session.user.facilityId },
      update: {
        iceDepthRetention,
        iceOpsRetention,
        refrigerationRetention,
        airQualityRetention,
        incidentRetention,
        scheduleRetention,
        checklistRetention,
        coWarningPpm,
        coEvacuationPpm,
        no2WarningPpm,
        no2EvacuationPpm,
        enableAirQualityAlerts,
        smsEnabled,
        smsProvider,
      },
      create: {
        facilityId: session.user.facilityId,
        iceDepthRetention,
        iceOpsRetention,
        refrigerationRetention,
        airQualityRetention,
        incidentRetention,
        scheduleRetention,
        checklistRetention,
        coWarningPpm,
        coEvacuationPpm,
        no2WarningPpm,
        no2EvacuationPpm,
        enableAirQualityAlerts,
        smsEnabled,
        smsProvider,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'FacilitySettings',
        entityId: settings.id,
        newValue: body,
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
