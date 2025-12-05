import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/forms - List form templates
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to admin module
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const moduleType = searchParams.get('moduleType')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const forms = await prisma.formTemplate.findMany({
      where: {
        facilityId: user.facilityId,
        ...(moduleType && { moduleType: moduleType as any }),
        ...(activeOnly && { isActive: true }),
      },
      orderBy: [
        { moduleType: 'asc' },
        { updatedAt: 'desc' },
      ],
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}

// POST /api/forms - Create a new form template
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create templates
    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, moduleType, schema, conditionalRules, calculatedFields } = body

    if (!name || !moduleType || !schema) {
      return NextResponse.json(
        { error: 'Name, moduleType, and schema are required' },
        { status: 400 }
      )
    }

    const form = await prisma.formTemplate.create({
      data: {
        facilityId: user.facilityId,
        name,
        description,
        moduleType,
        schema,
        conditionalRules,
        calculatedFields,
        createdBy: user.id,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        facilityId: user.facilityId,
        userId: user.id,
        action: 'CREATE_FORM_TEMPLATE',
        entityType: 'FormTemplate',
        entityId: form.id,
        details: { name, moduleType },
      },
    })

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    )
  }
}
