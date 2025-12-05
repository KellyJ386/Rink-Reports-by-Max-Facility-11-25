import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkAirQualityThresholds, triggerAirQualityAlert } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

// POST /api/alerts/air-quality - Check and trigger air quality alerts
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { coLevel, no2Level, rinkId, submissionId } = body

    if (coLevel === undefined && no2Level === undefined) {
      return NextResponse.json(
        { error: 'coLevel or no2Level is required' },
        { status: 400 }
      )
    }

    const result = await checkAirQualityThresholds(
      user.facilityId,
      coLevel || 0,
      no2Level || 0
    )

    if (!result.warning && !result.evacuation) {
      return NextResponse.json({
        alert: false,
        message: 'Air quality levels are within normal range',
      })
    }

    // Trigger alert
    const level = result.evacuation ? 'evacuation' : 'warning'
    const reading = result.type === 'CO' ? coLevel : no2Level
    const alertResult = await triggerAirQualityAlert(
      user.facilityId,
      level,
      result.type!,
      reading
    )

    // Log the alert
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'AirQualityAlert',
        entityId: submissionId || 'manual',
        newValue: {
          level,
          gasType: result.type,
          reading,
          rinkId,
        },
      },
    })

    return NextResponse.json({
      alert: true,
      level,
      type: result.type,
      reading,
      title: alertResult.title,
      message: alertResult.message,
    })
  } catch (error) {
    console.error('Error checking air quality:', error)
    return NextResponse.json(
      { error: 'Failed to check air quality' },
      { status: 500 }
    )
  }
}

// GET /api/alerts/air-quality - Get current thresholds
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: user.facilityId },
      select: {
        coWarningPpm: true,
        coEvacuationPpm: true,
        no2WarningPpm: true,
        no2EvacuationPpm: true,
        enableAirQualityAlerts: true,
      },
    })

    return NextResponse.json({
      thresholds: settings || {
        coWarningPpm: 20,
        coEvacuationPpm: 83,
        no2WarningPpm: 0.3,
        no2EvacuationPpm: 2.0,
        enableAirQualityAlerts: true,
      },
    })
  } catch (error) {
    console.error('Error fetching thresholds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thresholds' },
      { status: 500 }
    )
  }
}
