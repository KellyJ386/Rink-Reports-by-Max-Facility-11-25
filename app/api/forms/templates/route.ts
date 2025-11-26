import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/forms/templates - List form templates
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const where: any = {
      facilityId: session.user.facilityId,
    }

    if (moduleType) {
      where.moduleType = moduleType
    }

    if (activeOnly) {
      where.isActive = true
    }

    const templates = await prisma.formTemplate.findMany({
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
        createdBy: true,
        _count: {
          select: { submissions: true },
        },
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// POST /api/forms/templates - Create form template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check admin permission
    const canAccess = await canUserAccess(session.user.id, 'admin', 'createTemplates')
    if (!canAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, moduleType, schema, conditionalRules, calculatedFields } = body

    if (!name || !moduleType || !schema) {
      return NextResponse.json(
        { error: 'Name, moduleType, and schema are required' },
        { status: 400 }
      )
    }

    const template = await prisma.formTemplate.create({
      data: {
        facilityId: session.user.facilityId,
        name,
        description,
        moduleType,
        schema,
        conditionalRules,
        calculatedFields,
        createdBy: session.user.id,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        newValue: { name, moduleType },
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating form template:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
