import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'
import { ModuleType } from '@/types'

export const dynamic = 'force-dynamic'

// GET /api/submissions - List submissions with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType') as ModuleType | null
    const rinkId = searchParams.get('rinkId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))

    // Determine view scope based on permissions
    const permissions = getUserPermissions(user)
    let submittedByFilter = {}

    if (moduleType) {
      const modulePermissions = permissions[moduleType]
      if (!modulePermissions?.access) {
        return NextResponse.json({ error: 'Access denied to this module' }, { status: 403 })
      }
      if (!modulePermissions.viewAll && modulePermissions.viewOwn) {
        submittedByFilter = { submittedById: user.id }
      }
    }

    const where = {
      formTemplate: {
        facilityId: user.facilityId,
        ...(moduleType && { moduleType }),
      },
      ...(rinkId && { rinkId }),
      ...(status && { status: status as any }),
      ...(startDate && { submittedAt: { gte: new Date(startDate) } }),
      ...(endDate && { submittedAt: { lte: new Date(endDate) } }),
      ...submittedByFilter,
      archivedAt: null,
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          formTemplate: {
            select: { id: true, name: true, moduleType: true, version: true },
          },
          rink: {
            select: { id: true, name: true },
          },
          submittedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { attachments: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ])

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
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
    const { formTemplateId, rinkId, data, outsideTemp, outsideTempUnit, status, clientId } = body

    if (!formTemplateId || !rinkId || !data) {
      return NextResponse.json(
        { error: 'formTemplateId, rinkId, and data are required' },
        { status: 400 }
      )
    }

    // Get form template to check permissions
    const formTemplate = await prisma.formTemplate.findFirst({
      where: { id: formTemplateId, facilityId: user.facilityId },
    })

    if (!formTemplate) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    // Check submit permission for the module
    const moduleKey = formTemplate.moduleType.toLowerCase().replace('_', '') as ModuleType
    if (!canUserAccess(user, moduleKey, 'submit')) {
      return NextResponse.json({ error: 'No permission to submit to this module' }, { status: 403 })
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

    const submission = await prisma.submission.create({
      data: {
        formTemplateId,
        formVersionAtSubmission: formTemplate.version,
        rinkId,
        submittedById: user.id,
        data,
        outsideTemp,
        outsideTempUnit: outsideTempUnit || 'F',
        status: status || 'SUBMITTED',
        clientId,
        syncedAt: clientId ? new Date() : null,
      },
      include: {
        formTemplate: {
          select: { id: true, name: true, moduleType: true },
        },
        rink: {
          select: { id: true, name: true },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        submissionId: submission.id,
        newValue: { formTemplate: formTemplate.name, rink: rinkId },
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
