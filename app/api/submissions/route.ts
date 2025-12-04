import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'
import { ModuleType } from '@/types'

// Map database module types to permission module names
const moduleTypeMap: Record<string, ModuleType> = {
  ICE_DEPTH: 'iceDepth',
  ICE_OPERATIONS: 'iceOperations',
  REFRIGERATION: 'refrigeration',
  AIR_QUALITY: 'airQuality',
  INCIDENT: 'incidents',
  SCHEDULE: 'schedule',
  DAILY_CHECKLIST: 'dailyChecklist',
}

/**
 * GET /api/submissions
 * List submissions for the user's facility
 * Query params: moduleType, rinkId, status, startDate, endDate, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const rinkId = searchParams.get('rinkId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const permissions = getUserPermissions(user)

    // Build query
    const where: any = {
      rink: {
        facilityId: user.facilityId,
      },
      archivedAt: null, // Exclude archived
    }

    // Filter by module type
    if (moduleType) {
      where.formTemplate = { moduleType }

      // Check permission for this module
      const permModule = moduleTypeMap[moduleType]
      if (permModule && !permissions[permModule]?.access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Check if user can view all or only own
      if (permModule && !permissions[permModule]?.viewAll) {
        where.submittedById = user.id
      }
    }

    // Filter by rink
    if (rinkId) {
      where.rinkId = rinkId
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    // Filter by date range
    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        where.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.submittedAt.lte = new Date(endDate)
      }
    }

    // Fetch submissions
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

/**
 * POST /api/submissions
 * Create a new submission
 */
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
      status = 'SUBMITTED',
      outsideTemp,
      outsideTempUnit = 'F',
      clientId, // For offline sync dedup
    } = body

    if (!formTemplateId || !rinkId || !data) {
      return NextResponse.json(
        { error: 'formTemplateId, rinkId, and data are required' },
        { status: 400 }
      )
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

    // Get form template to check permissions
    const formTemplate = await prisma.formTemplate.findFirst({
      where: {
        id: formTemplateId,
        facilityId: user.facilityId,
        isActive: true,
      },
    })

    if (!formTemplate) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    // Check permission
    const permModule = moduleTypeMap[formTemplate.moduleType]
    const permissions = getUserPermissions(user)
    if (permModule && !permissions[permModule]?.submit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Verify rink belongs to facility
    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formTemplateId,
        formVersionAtSubmission: formTemplate.version,
        rinkId,
        submittedById: user.id,
        data,
        status: status as any,
        outsideTemp,
        outsideTempUnit,
        clientId,
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
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        submissionId: submission.id,
        newValue: {
          moduleType: formTemplate.moduleType,
          rinkName: rink.name,
          status,
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
