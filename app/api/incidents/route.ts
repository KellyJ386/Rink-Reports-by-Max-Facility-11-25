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
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const facilityId = session.facilityId

    const where: Record<string, unknown> = {
      formTemplate: {
        facilityId,
        moduleType: 'INCIDENT'
      },
      archivedAt: null
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (status) {
      where.status = status
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

    // Get counts by status
    const pendingCount = await prisma.submission.count({
      where: {
        formTemplate: { facilityId, moduleType: 'INCIDENT' },
        status: 'PENDING_REVIEW',
        archivedAt: null
      }
    })

    return NextResponse.json({ submissions, rinks, pendingCount })
  } catch (error) {
    console.error('Incidents error:', error)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rinkId, incidentType, data, notes } = body

    if (!rinkId || !incidentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const facilityId = session.facilityId

    let template = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'INCIDENT',
        name: incidentType
      }
    })

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          facilityId,
          moduleType: 'INCIDENT',
          name: incidentType,
          createdBy: session.id,
          schema: {
            fields: [
              { id: 'incidentType', type: 'select', label: 'Incident Type', required: true },
              { id: 'incidentDate', type: 'datetime', label: 'Date/Time of Incident', required: true },
              { id: 'location', type: 'text', label: 'Specific Location', required: true },
              { id: 'description', type: 'textarea', label: 'Description', required: true },
              { id: 'injuredPerson', type: 'text', label: 'Injured Person Name', required: false },
              { id: 'injuryType', type: 'text', label: 'Type of Injury', required: false },
              { id: 'ambulanceCalled', type: 'boolean', label: 'Ambulance Called', required: false },
              { id: 'witnesses', type: 'textarea', label: 'Witnesses', required: false },
              { id: 'actionTaken', type: 'textarea', label: 'Action Taken', required: false }
            ]
          }
        }
      })
    }

    const ambulanceCalled = data.ambulanceCalled === true || data.ambulanceCalled === 'true'

    const submission = await prisma.submission.create({
      data: {
        formTemplateId: template.id,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.id,
        data: {
          incidentType,
          ...data,
          notes
        },
        status: 'PENDING_REVIEW'
      },
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        facilityId,
        type: ambulanceCalled ? 'INCIDENT_AMBULANCE' : 'INCIDENT_SUBMITTED',
        title: ambulanceCalled ? 'AMBULANCE CALLED - Incident Report' : 'New Incident Report',
        message: `${incidentType} at ${submission.rink.name} - requires review`,
        relatedEntityType: 'Submission',
        relatedEntityId: submission.id
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Incidents create error:', error)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, reviewNotes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        reviewedById: session.id,
        reviewedAt: new Date(),
        reviewNotes
      },
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Incidents update error:', error)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}
