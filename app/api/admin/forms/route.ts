import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAdminPermission,
  logAdminAction,
  getClientIP,
  getUserAgent,
} from '@/lib/adminAuth'
import { createFormTemplateSchema } from '@/lib/validations/admin'

// GET /api/admin/forms - List all form templates
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminPermission('access')

    const searchParams = request.nextUrl.searchParams
    const moduleType = searchParams.get('moduleType')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    if (moduleType) {
      where.moduleType = moduleType
    }

    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const forms = await prisma.formTemplate.findMany({
      where,
      orderBy: [
        { moduleType: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        moduleType: true,
        name: true,
        description: true,
        version: true,
        isActive: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { submissions: true },
        },
      },
    })

    return NextResponse.json({
      forms: forms.map((form) => ({
        ...form,
        submissionCount: form._count.submissions,
        _count: undefined,
      })),
    })
  } catch (error) {
    console.error('Error fetching forms:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}

// POST /api/admin/forms - Create a new form template
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminPermission('editForms')

    const body = await request.json()
    const validation = createFormTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const newForm = await prisma.formTemplate.create({
      data: {
        facilityId: adminUser.facilityId,
        moduleType: data.moduleType,
        name: data.name,
        description: data.description,
        schema: data.schema,
        createdBy: adminUser.id,
        version: 1,
        isActive: true,
      },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'CREATE',
      'FormTemplate',
      newForm.id,
      null,
      { name: newForm.name, moduleType: newForm.moduleType },
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json(newForm, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    )
  }
}
