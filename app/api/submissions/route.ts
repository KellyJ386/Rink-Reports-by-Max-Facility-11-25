import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'
import { ModuleType } from '@prisma/client'

// Map module types to permission keys
const modulePermissionMap: Record<ModuleType, string> = {
  ICE_DEPTH: 'iceDepth',
  ICE_OPERATIONS: 'iceOperations',
  REFRIGERATION: 'refrigeration',
  AIR_QUALITY: 'airQuality',
  INCIDENT: 'incidents',
  SCHEDULE: 'schedule',
  DAILY_CHECKLIST: 'dailyChecklist',
}

// GET /api/submissions - List submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType') as ModuleType | null
    const rinkId = searchParams.get('rinkId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const permissions = await getUserPermissions(session.user.id)

    // Build where clause
    const where: any = {
      formTemplate: {
        facilityId: session.user.facilityId,
      },
      archivedAt: null,
    }

    if (moduleType) {
      where.formTemplate.moduleType = moduleType

      // Check module access
      const permKey = modulePermissionMap[moduleType]
      if (!permissions[permKey]?.access) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }

      // Check viewAll vs viewOwn
      if (!permissions[permKey]?.viewAll && permissions[permKey]?.viewOwn) {
        where.submittedById = session.user.id
      }
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (status) {
      where.status = status
    }

    if (startDate) {
      where.submittedAt = {
        ...where.submittedAt,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.submittedAt = {
        ...where.submittedAt,
        lte: new Date(endDate),
      }
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { submittedAt: 'desc' },
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
      }),
      prisma.submission.count({ where }),
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/submissions - Create submission
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      formTemplateId,
      rinkId,
      data,
      outsideTemp,
      outsideTempUnit = 'F',
      clientId,
      status = 'SUBMITTED',
    } = body

    if (!formTemplateId || !rinkId || !data) {
      return NextResponse.json(
        { error: 'formTemplateId, rinkId, and data are required' },
        { status: 400 }
      )
    }

    // Get the form template
    const template = await prisma.formTemplate.findFirst({
      where: {
        id: formTemplateId,
        facilityId: session.user.facilityId,
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    // Check permission
    const permKey = modulePermissionMap[template.moduleType]
    const canSubmit = await canUserAccess(session.user.id, permKey, 'submit')
    if (!canSubmit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Verify rink belongs to facility
    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facility: { id: session.user.facilityId },
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Check for duplicate (offline sync)
    if (clientId) {
      const existing = await prisma.submission.findFirst({
        where: { clientId },
      })
      if (existing) {
        return NextResponse.json({ submission: existing, duplicate: true })
      }
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formTemplateId,
        formVersionAtSubmission: template.version,
        rinkId,
        submittedById: session.user.id,
        data,
        outsideTemp,
        outsideTempUnit,
        clientId,
        status,
        syncedAt: new Date(),
      },
      include: {
        formTemplate: {
          select: {
            name: true,
            moduleType: true,
          },
        },
        rink: {
          select: {
            name: true,
          },
        },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        submissionId: submission.id,
        newValue: {
          moduleType: template.moduleType,
          rink: rink.name,
        },
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
