import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/submissions - List submissions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const rinkId = searchParams.get('rinkId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      formTemplate: {
        facilityId: user.facilityId,
      },
      archivedAt: null, // Don't include archived submissions by default
    }

    if (moduleType) {
      where.formTemplate.moduleType = moduleType
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        where.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.submittedAt.lte = new Date(endDate)
      }
    }

    if (status) {
      where.status = status
    }

    // Get submissions with related data
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          formTemplate: {
            select: {
              id: true,
              name: true,
              moduleType: true,
              version: true,
            },
          },
          rink: {
            select: {
              id: true,
              name: true,
            },
          },
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.submission.count({ where }),
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + submissions.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      formTemplateId,
      rinkId,
      data,
      outsideTemp,
      outsideTempUnit,
      submittedAt,
      clientId, // For offline sync
    } = body

    // Validate required fields
    if (!formTemplateId || !rinkId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: formTemplateId, rinkId, data' },
        { status: 400 }
      )
    }

    // Check if this is a duplicate (offline sync)
    if (clientId) {
      const existing = await prisma.submission.findFirst({
        where: { clientId },
      })
      if (existing) {
        return NextResponse.json(existing, { status: 200 })
      }
    }

    // Get the form template
    const template = await prisma.formTemplate.findUnique({
      where: { id: formTemplateId },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    // Verify template belongs to user's facility
    if (template.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify rink belongs to user's facility
    const rink = await prisma.rink.findUnique({
      where: { id: rinkId },
    })

    if (!rink || rink.facilityId !== user.facilityId) {
      return NextResponse.json(
        { error: 'Invalid rink' },
        { status: 400 }
      )
    }

    // Check user permissions for this module
    const permissions = getUserPermissions(user)
    const moduleKey = template.moduleType.toLowerCase().replace('_', '')
    const modulePermission = (permissions as any)[moduleKey]

    if (!modulePermission?.submit) {
      return NextResponse.json(
        { error: 'You do not have permission to submit this type of report' },
        { status: 403 }
      )
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        formTemplateId,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: user.id,
        submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
        outsideTemp: outsideTemp ?? null,
        outsideTempUnit: outsideTempUnit || 'F',
        data,
        status: template.moduleType === 'INCIDENT' ? 'PENDING_REVIEW' : 'SUBMITTED',
        clientId: clientId || null,
        syncedAt: clientId ? new Date() : null,
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
          },
        },
        rink: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
