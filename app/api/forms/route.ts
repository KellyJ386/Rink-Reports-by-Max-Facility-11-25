import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'

// GET /api/forms - List all form templates for the facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const moduleType = searchParams.get('moduleType')

    const templates = await prisma.formTemplate.findMany({
      where: {
        facilityId: user.facilityId,
        ...(moduleType ? { moduleType: moduleType as never } : {}),
      },
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
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching form templates' },
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

    // Check if user has admin access with form editing permission
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, moduleType, schema, conditionalRules } = body

    if (!name || !moduleType || !schema) {
      return NextResponse.json(
        { error: 'Name, module type, and schema are required' },
        { status: 400 }
      )
    }

    const template = await prisma.formTemplate.create({
      data: {
        facilityId: user.facilityId,
        name,
        description,
        moduleType,
        schema,
        conditionalRules,
        createdBy: user.id,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        newValue: { name, moduleType },
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating form template:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating form template' },
      { status: 500 }
    )
  }
}
