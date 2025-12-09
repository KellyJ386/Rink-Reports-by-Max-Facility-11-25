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
    const type = searchParams.get('type') // resurfacing, cut, maintenance

    const facilityId = session.facilityId

    const where: Record<string, unknown> = {
      formTemplate: {
        facilityId,
        moduleType: 'ICE_OPERATIONS'
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

    // Get rinks for the facility
    const rinks = await prisma.rink.findMany({
      where: { facilityId, isActive: true },
      select: { id: true, name: true }
    })

    return NextResponse.json({ submissions, rinks })
  } catch (error) {
    console.error('Ice operations error:', error)
    return NextResponse.json({ error: 'Failed to fetch ice operations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rinkId, operationType, data, notes, outsideTemp } = body

    if (!rinkId || !operationType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const facilityId = session.facilityId

    // Get or create a form template for this operation type
    let template = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'ICE_OPERATIONS',
        name: operationType
      }
    })

    if (!template) {
      template = await prisma.formTemplate.create({
        data: {
          facilityId,
          moduleType: 'ICE_OPERATIONS',
          name: operationType,
          createdBy: session.id,
          schema: {
            fields: [
              { id: 'operationType', type: 'select', label: 'Operation Type', required: true },
              { id: 'duration', type: 'number', label: 'Duration (minutes)', required: false },
              { id: 'machineUsed', type: 'text', label: 'Machine/Equipment', required: false },
              { id: 'waterTemp', type: 'number', label: 'Water Temperature', required: false },
              { id: 'notes', type: 'textarea', label: 'Notes', required: false }
            ]
          }
        }
      })
    }

    const submission = await prisma.submission.create({
      data: {
        formTemplateId: template.id,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.id,
        outsideTemp: outsideTemp ? parseFloat(outsideTemp) : null,
        data: {
          operationType,
          ...data,
          notes
        },
        status: 'SUBMITTED'
      },
      include: {
        rink: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } }
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Ice operations create error:', error)
    return NextResponse.json({ error: 'Failed to create ice operation' }, { status: 500 })
  }
}
