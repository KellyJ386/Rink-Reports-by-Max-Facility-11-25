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
        moduleType: 'AIR_QUALITY'
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
        coWarningPpm: true,
        coEvacuationPpm: true,
        no2WarningPpm: true,
        no2EvacuationPpm: true
      }
    })

    const thresholds = settings || {
      coWarningPpm: 20,
      coEvacuationPpm: 83,
      no2WarningPpm: 0.3,
      no2EvacuationPpm: 2.0
    }

    return NextResponse.json({ submissions, rinks, thresholds })
  } catch (error) {
    console.error('Air quality error:', error)
    return NextResponse.json({ error: 'Failed to fetch air quality data' }, { status: 500 })
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

    if (!rinkId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const facilityId = session.facilityId
    const typeName = readingType || 'Air Quality Reading'

    let template = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'AIR_QUALITY',
        name: typeName
      }
    })

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          facilityId,
          moduleType: 'AIR_QUALITY',
          name: typeName,
          createdBy: session.id,
          schema: {
            fields: [
              { id: 'coPpm', type: 'number', label: 'CO (PPM)', required: false },
              { id: 'no2Ppm', type: 'number', label: 'NO2 (PPM)', required: false },
              { id: 'temperature', type: 'number', label: 'Temperature (°F)', required: false },
              { id: 'humidity', type: 'number', label: 'Humidity (%)', required: false },
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

    const coWarning = settings?.coWarningPpm || 20
    const coEvac = settings?.coEvacuationPpm || 83
    const no2Warning = settings?.no2WarningPpm || 0.3
    const no2Evac = settings?.no2EvacuationPpm || 2.0

    const coPpm = data.coPpm ? parseFloat(data.coPpm) : null
    const no2Ppm = data.no2Ppm ? parseFloat(data.no2Ppm) : null

    let alertLevel = 'normal'
    if ((coPpm && coPpm >= coEvac) || (no2Ppm && no2Ppm >= no2Evac)) {
      alertLevel = 'evacuation'
    } else if ((coPpm && coPpm >= coWarning) || (no2Ppm && no2Ppm >= no2Warning)) {
      alertLevel = 'warning'
    }

    const submission = await prisma.submission.create({
      data: {
        formTemplateId: template.id,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.id,
        data: {
          ...data,
          alertLevel,
          notes
        },
        status: 'SUBMITTED'
      },
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    // Create notification if alert level is elevated
    if (alertLevel !== 'normal') {
      await prisma.notification.create({
        data: {
          facilityId,
          type: alertLevel === 'evacuation' ? 'AIR_QUALITY_EVACUATION' : 'AIR_QUALITY_WARNING',
          title: alertLevel === 'evacuation' ? 'EVACUATION REQUIRED' : 'Air Quality Warning',
          message: `${submission.rink.name}: CO ${coPpm || 'N/A'} PPM, NO2 ${no2Ppm || 'N/A'} PPM`,
          relatedEntityType: 'Submission',
          relatedEntityId: submission.id
        }
      })
    }

    return NextResponse.json({ ...submission, alertLevel }, { status: 201 })
  } catch (error) {
    console.error('Air quality create error:', error)
    return NextResponse.json({ error: 'Failed to create air quality reading' }, { status: 500 })
  }
}
