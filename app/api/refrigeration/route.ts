import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rinkId = searchParams.get('rinkId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const facilityId = session.facilityId

    const where: Record<string, unknown> = {
      formTemplate: {
        facilityId,
        moduleType: 'REFRIGERATION'
      },
      archivedAt: null
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        (where.submittedAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999);
        (where.submittedAt as Record<string, Date>).lte = end
      }
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        formTemplate: { select: { id: true, name: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 100
    })

    const rinks = await prisma.rink.findMany({
      where: { facilityId, isActive: true },
      select: { id: true, name: true }
    })

    // Get facility settings for thresholds
    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId },
      select: {
        suctionPressureMinWarning: true,
        suctionPressureMaxWarning: true,
        suctionPressureMinCritical: true,
        suctionPressureMaxCritical: true,
        dischargePressureMinWarning: true,
        dischargePressureMaxWarning: true,
        dischargePressureMinCritical: true,
        dischargePressureMaxCritical: true,
        compressorTempWarning: true,
        compressorTempCritical: true,
        brineTempMinWarning: true,
        brineTempMaxWarning: true,
        brineTempMinCritical: true,
        brineTempMaxCritical: true,
        enableRefrigerationAlerts: true
      }
    })

    const thresholds = settings || {
      suctionPressureMinWarning: 20,
      suctionPressureMaxWarning: 45,
      suctionPressureMinCritical: 15,
      suctionPressureMaxCritical: 50,
      dischargePressureMinWarning: 150,
      dischargePressureMaxWarning: 250,
      dischargePressureMinCritical: 120,
      dischargePressureMaxCritical: 300,
      compressorTempWarning: 200,
      compressorTempCritical: 250,
      brineTempMinWarning: 14,
      brineTempMaxWarning: 28,
      brineTempMinCritical: 10,
      brineTempMaxCritical: 32,
      enableRefrigerationAlerts: true
    }

    return NextResponse.json({ submissions, rinks, thresholds })
  } catch (error) {
    console.error('Refrigeration error:', error)
    return NextResponse.json({ error: 'Failed to fetch refrigeration data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rinkId, readingType, data, notes } = body

    if (!rinkId || !readingType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const facilityId = session.facilityId

    let template = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'REFRIGERATION',
        name: readingType
      }
    })

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          facilityId,
          moduleType: 'REFRIGERATION',
          name: readingType,
          createdBy: session.id,
          schema: {
            fields: [
              { id: 'readingType', type: 'select', label: 'Reading Type', required: true },
              { id: 'compressorTemp', type: 'number', label: 'Compressor Temp (°F)', required: false },
              { id: 'suctionPressure', type: 'number', label: 'Suction Pressure (PSI)', required: false },
              { id: 'dischargePressure', type: 'number', label: 'Discharge Pressure (PSI)', required: false },
              { id: 'brineTemp', type: 'number', label: 'Brine Temp (°F)', required: false },
              { id: 'notes', type: 'textarea', label: 'Notes', required: false }
            ]
          }
        }
      })
    }

    // Check for threshold violations
    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId }
    })

    const thresholds = {
      suctionPressureMinWarning: settings?.suctionPressureMinWarning || 20,
      suctionPressureMaxWarning: settings?.suctionPressureMaxWarning || 45,
      suctionPressureMinCritical: settings?.suctionPressureMinCritical || 15,
      suctionPressureMaxCritical: settings?.suctionPressureMaxCritical || 50,
      dischargePressureMinWarning: settings?.dischargePressureMinWarning || 150,
      dischargePressureMaxWarning: settings?.dischargePressureMaxWarning || 250,
      dischargePressureMinCritical: settings?.dischargePressureMinCritical || 120,
      dischargePressureMaxCritical: settings?.dischargePressureMaxCritical || 300,
      compressorTempWarning: settings?.compressorTempWarning || 200,
      compressorTempCritical: settings?.compressorTempCritical || 250,
      brineTempMinWarning: settings?.brineTempMinWarning || 14,
      brineTempMaxWarning: settings?.brineTempMaxWarning || 28,
      brineTempMinCritical: settings?.brineTempMinCritical || 10,
      brineTempMaxCritical: settings?.brineTempMaxCritical || 32,
      enableRefrigerationAlerts: settings?.enableRefrigerationAlerts ?? true
    }

    const suctionPressure = data.suctionPressure ? parseFloat(String(data.suctionPressure)) : null
    const dischargePressure = data.dischargePressure ? parseFloat(String(data.dischargePressure)) : null
    const compressorTemp = data.compressorTemp ? parseFloat(String(data.compressorTemp)) : null
    const brineTemp = data.brineTemp ? parseFloat(String(data.brineTemp)) : null

    // Check for critical/warning conditions
    const alerts: string[] = []
    let hasCritical = false
    let hasWarning = false

    // Suction pressure checks
    if (suctionPressure !== null) {
      if (suctionPressure <= thresholds.suctionPressureMinCritical || suctionPressure >= thresholds.suctionPressureMaxCritical) {
        hasCritical = true
        alerts.push(`Suction pressure ${suctionPressure} PSI is CRITICAL`)
      } else if (suctionPressure <= thresholds.suctionPressureMinWarning || suctionPressure >= thresholds.suctionPressureMaxWarning) {
        hasWarning = true
        alerts.push(`Suction pressure ${suctionPressure} PSI is outside normal range`)
      }
    }

    // Discharge pressure checks
    if (dischargePressure !== null) {
      if (dischargePressure <= thresholds.dischargePressureMinCritical || dischargePressure >= thresholds.dischargePressureMaxCritical) {
        hasCritical = true
        alerts.push(`Discharge pressure ${dischargePressure} PSI is CRITICAL`)
      } else if (dischargePressure <= thresholds.dischargePressureMinWarning || dischargePressure >= thresholds.dischargePressureMaxWarning) {
        hasWarning = true
        alerts.push(`Discharge pressure ${dischargePressure} PSI is outside normal range`)
      }
    }

    // Compressor temperature checks
    if (compressorTemp !== null) {
      if (compressorTemp >= thresholds.compressorTempCritical) {
        hasCritical = true
        alerts.push(`Compressor temp ${compressorTemp}°F is CRITICAL`)
      } else if (compressorTemp >= thresholds.compressorTempWarning) {
        hasWarning = true
        alerts.push(`Compressor temp ${compressorTemp}°F is elevated`)
      }
    }

    // Brine temperature checks
    if (brineTemp !== null) {
      if (brineTemp <= thresholds.brineTempMinCritical || brineTemp >= thresholds.brineTempMaxCritical) {
        hasCritical = true
        alerts.push(`Brine temp ${brineTemp}°F is CRITICAL`)
      } else if (brineTemp <= thresholds.brineTempMinWarning || brineTemp >= thresholds.brineTempMaxWarning) {
        hasWarning = true
        alerts.push(`Brine temp ${brineTemp}°F is outside normal range`)
      }
    }

    const alertLevel = hasCritical ? 'critical' : hasWarning ? 'warning' : 'normal'

    const submission = await prisma.submission.create({
      data: {
        formTemplateId: template.id,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.id,
        data: {
          readingType,
          ...data,
          alertLevel,
          alerts,
          notes
        },
        status: 'SUBMITTED'
      },
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    // Create notification if alert level is elevated and alerts are enabled
    if (alertLevel !== 'normal' && thresholds.enableRefrigerationAlerts) {
      await prisma.notification.create({
        data: {
          facilityId,
          type: 'SYSTEM',
          title: alertLevel === 'critical' ? 'REFRIGERATION CRITICAL ALERT' : 'Refrigeration Warning',
          message: `${submission.rink.name}: ${alerts.join(', ')}`,
          relatedEntityType: 'Submission',
          relatedEntityId: submission.id
        }
      })
    }

    return NextResponse.json({ ...submission, alertLevel, alerts }, { status: 201 })
  } catch (error) {
    console.error('Refrigeration create error:', error)
    return NextResponse.json({ error: 'Failed to create refrigeration reading' }, { status: 500 })
  }
}
