import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import type { ModuleType } from '@/types'

export const dynamic = 'force-dynamic'

// Map module types to permission keys
const MODULE_TO_PERMISSION: Record<string, ModuleType> = {
  ICE_DEPTH: 'iceDepth',
  ICE_OPERATIONS: 'iceOperations',
  REFRIGERATION: 'refrigeration',
  AIR_QUALITY: 'airQuality',
  INCIDENT: 'incidents',
  SCHEDULE: 'schedule',
  DAILY_CHECKLIST: 'dailyChecklist',
}

// GET - List submissions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const rinkId = searchParams.get('rinkId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = {
      archivedAt: null,
      formTemplate: {
        facilityId: user.facilityId,
      },
    }

    if (moduleType) {
      where.formTemplate = {
        ...where.formTemplate as object,
        moduleType,
      }
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (status) {
      where.status = status
    }

    // Check if user can view all or only own submissions
    const permissionKey = moduleType ? MODULE_TO_PERMISSION[moduleType] : null
    const canViewAll = permissionKey
      ? canUserAccess(user, permissionKey, 'viewAll')
      : false

    if (!canViewAll) {
      where.submittedById = user.id
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

    return NextResponse.json({ submissions, total, limit, offset })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create submission
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { formTemplateId, rinkId, data, status = 'SUBMITTED', outsideTemp, outsideTempUnit, clientId } = body

    if (!formTemplateId || !rinkId || !data) {
      return NextResponse.json(
        { error: 'formTemplateId, rinkId, and data are required' },
        { status: 400 }
      )
    }

    // Fetch the form template to check permissions and get version
    const template = await prisma.formTemplate.findUnique({
      where: { id: formTemplateId },
      select: {
        id: true,
        facilityId: true,
        moduleType: true,
        version: true,
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    if (template.facilityId !== user.facilityId) {
      return NextResponse.json(
        { error: 'Form template not found' },
        { status: 404 }
      )
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: 'Form template is not active' },
        { status: 400 }
      )
    }

    // Check permission to submit
    const permissionKey = MODULE_TO_PERMISSION[template.moduleType]
    if (permissionKey && !canUserAccess(user, permissionKey, 'submit')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify rink belongs to facility
    const rink = await prisma.rink.findUnique({
      where: { id: rinkId },
      select: { facilityId: true },
    })

    if (!rink || rink.facilityId !== user.facilityId) {
      return NextResponse.json(
        { error: 'Rink not found' },
        { status: 404 }
      )
    }

    // Check for duplicate submission (offline sync)
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
        submittedById: user.id,
        data,
        status: status as 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW',
        outsideTemp,
        outsideTempUnit: outsideTempUnit || 'F',
        clientId,
        syncedAt: clientId ? new Date() : null,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        newValue: {
          templateName: submission.formTemplate.name,
          rinkName: submission.rink.name,
          status,
        },
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
