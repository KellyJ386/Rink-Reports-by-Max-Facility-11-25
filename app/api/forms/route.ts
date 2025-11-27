import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/forms - List all form templates for the user's facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const activeOnly = searchParams.get('active') !== 'false'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    const where = {
      facilityId: user.facilityId,
      ...(moduleType && { moduleType: moduleType as any }),
      ...(activeOnly && { isActive: true }),
    }

    const [forms, total] = await Promise.all([
      prisma.formTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          moduleType: true,
          version: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { submissions: true },
          },
        },
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.formTemplate.count({ where }),
    ])

    return NextResponse.json({ forms, total, ...(limit !== undefined && { limit, offset: offset || 0 }) })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

// POST /api/forms - Create a new form template
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission for creating templates
    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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
        version: 1,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: form.id,
        newValue: { name, moduleType },
      },
    })

    return NextResponse.json({ form }, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
