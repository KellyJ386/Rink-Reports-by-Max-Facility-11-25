import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/submissions - List submissions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const moduleType = searchParams.get('moduleType')
    const status = searchParams.get('status')
    const rinkId = searchParams.get('rinkId')
    const formTemplateId = searchParams.get('formTemplateId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the module type string for permission check
    const moduleTypeMap: Record<string, string> = {
      ICE_DEPTH: 'iceDepth',
      ICE_OPERATIONS: 'iceOperations',
      REFRIGERATION: 'refrigeration',
      AIR_QUALITY: 'airQuality',
      INCIDENT: 'incidents',
      SCHEDULE: 'schedule',
      DAILY_CHECKLIST: 'dailyChecklist',
    }

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by module type if specified
    if (moduleType) {
      where.formTemplate = { moduleType }
    }

    if (status) {
      where.status = status
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (formTemplateId) {
      where.formTemplateId = formTemplateId
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate)
      }
    }

    // Check if user can view all or only own submissions
    const permissionModule = moduleType ? moduleTypeMap[moduleType] : null
    const canViewAll = permissionModule
      ? canUserAccess(user, permissionModule as any, 'viewAll')
      : true

    if (!canViewAll) {
      // Only show user's own submissions
      where.userId = user.id
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          formTemplate: {
            select: {
              id: true,
              name: true,
              moduleType: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          rink: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
    const { formTemplateId, rinkId, data, status = 'DRAFT' } = body

    if (!formTemplateId || !data) {
      return NextResponse.json(
        { error: 'formTemplateId and data are required' },
        { status: 400 }
      )
    }

    // Verify form template exists and belongs to facility
    const formTemplate = await prisma.formTemplate.findUnique({
      where: { id: formTemplateId },
    })

    if (!formTemplate) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    if (formTemplate.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check permission to submit
    const moduleTypeMap: Record<string, string> = {
      ICE_DEPTH: 'iceDepth',
      ICE_OPERATIONS: 'iceOperations',
      REFRIGERATION: 'refrigeration',
      AIR_QUALITY: 'airQuality',
      INCIDENT: 'incidents',
      SCHEDULE: 'schedule',
      DAILY_CHECKLIST: 'dailyChecklist',
    }

    const permissionModule = moduleTypeMap[formTemplate.moduleType]
    if (!canUserAccess(user, permissionModule as any, 'submit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const submission = await prisma.submission.create({
      data: {
        formTemplateId,
        facilityId: user.facilityId,
        userId: user.id,
        rinkId,
        data,
        status,
        submittedAt: status === 'SUBMITTED' ? new Date() : null,
      },
      include: {
        formTemplate: {
          select: {
            id: true,
            name: true,
            moduleType: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        facilityId: user.facilityId,
        userId: user.id,
        action: status === 'SUBMITTED' ? 'SUBMIT_REPORT' : 'CREATE_DRAFT',
        entityType: 'Submission',
        entityId: submission.id,
        details: {
          formTemplateName: formTemplate.name,
          moduleType: formTemplate.moduleType,
        },
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
