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

    return NextResponse.json({ submissions, rinks })
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

    const submission = await prisma.submission.create({
      data: {
        formTemplateId: template.id,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.id,
        data: {
          readingType,
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
    console.error('Refrigeration create error:', error)
    return NextResponse.json({ error: 'Failed to create refrigeration reading' }, { status: 500 })
  }
}
