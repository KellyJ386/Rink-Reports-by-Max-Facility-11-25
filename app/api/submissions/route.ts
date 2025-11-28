import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateFormData, FormSchema } from '@/types/form-builder'

// GET /api/submissions - List submissions with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const status = searchParams.get('status')
    const rinkId = searchParams.get('rinkId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    interface SubmissionWhere {
      facilityId: string
      templateId?: string
      status?: string
      rinkId?: string
      submittedAt?: {
        gte?: Date
        lte?: Date
      }
    }

    const where: SubmissionWhere = {
      facilityId: user.facilityId,
    }

    if (templateId) where.templateId = templateId
    if (status) where.status = status
    if (rinkId) where.rinkId = rinkId
    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) where.submittedAt.gte = new Date(startDate)
      if (endDate) where.submittedAt.lte = new Date(endDate)
    }

    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          template: {
            select: { name: true },
          },
          submitter: {
            select: { firstName: true, lastName: true },
          },
          rink: {
            select: { name: true },
          },
        },
      }),
      prisma.formSubmission.count({ where }),
    ])

    interface SubmissionResult {
      id: string
      status: string
      submittedAt: Date
      template: { name: string } | null
      submitter: { firstName: string; lastName: string } | null
      rink: { name: string } | null
    }

    const formattedSubmissions = (submissions as SubmissionResult[]).map((s) => ({
      id: s.id,
      templateName: s.template?.name || 'Unknown Template',
      rinkName: s.rink?.name || null,
      submittedByName: s.submitter
        ? `${s.submitter.firstName} ${s.submitter.lastName}`
        : 'Unknown',
      submittedAt: s.submittedAt.toISOString(),
      status: s.status,
    }))

    return NextResponse.json({
      submissions: formattedSubmissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching submissions' },
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
    const { templateId, data, rinkId, isDraft = false } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get the template to validate against
    const template = await prisma.formTemplate.findFirst({
      where: {
        id: templateId,
        facilityId: user.facilityId,
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Form template not found or inactive' },
        { status: 404 }
      )
    }

    // Validate the submission data unless it's a draft
    if (!isDraft) {
      const schema = template.schema as unknown as FormSchema
      const validation = validateFormData(schema, data || {})

      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', errors: validation.errors },
          { status: 400 }
        )
      }
    }

    // Verify rink belongs to facility if provided
    if (rinkId) {
      const rink = await prisma.rink.findFirst({
        where: {
          id: rinkId,
          facilityId: user.facilityId,
        },
      })
      if (!rink) {
        return NextResponse.json(
          { error: 'Rink not found' },
          { status: 404 }
        )
      }
    }

    // Create the submission
    const submission = await prisma.formSubmission.create({
      data: {
        templateId,
        facilityId: user.facilityId,
        rinkId: rinkId || null,
        submittedBy: user.id,
        data: data || {},
        status: isDraft ? 'draft' : 'submitted',
        submittedAt: isDraft ? new Date() : new Date(),
        templateVersion: template.version,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isDraft ? 'DRAFT' : 'CREATE',
        entityType: 'FormSubmission',
        entityId: submission.id,
        newValue: {
          templateId,
          templateName: template.name,
          status: isDraft ? 'draft' : 'submitted',
        },
      },
    })

    return NextResponse.json(
      {
        submission: {
          id: submission.id,
          status: submission.status
        },
        message: isDraft ? 'Draft saved successfully' : 'Form submitted successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating submission' },
      { status: 500 }
    )
  }
}
