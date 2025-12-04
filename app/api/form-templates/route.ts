import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess, getUserPermissions } from '@/lib/permissions'

/**
 * GET /api/form-templates
 * List all form templates for the user's facility
 * Query params: moduleType (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')

    const where: any = {
      facilityId: user.facilityId,
    }

    if (moduleType) {
      where.moduleType = moduleType
    }

    const templates = await prisma.formTemplate.findMany({
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
        createdBy: true,
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/form-templates
 * Create a new form template
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access || !permissions.admin?.editForms) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { moduleType, name, description, schema } = body

    if (!moduleType || !name || !schema) {
      return NextResponse.json(
        { error: 'moduleType, name, and schema are required' },
        { status: 400 }
      )
    }

    // Validate moduleType
    const validModuleTypes = [
      'ICE_DEPTH',
      'ICE_OPERATIONS',
      'REFRIGERATION',
      'AIR_QUALITY',
      'INCIDENT',
      'SCHEDULE',
      'DAILY_CHECKLIST',
    ]
    if (!validModuleTypes.includes(moduleType)) {
      return NextResponse.json(
        { error: 'Invalid moduleType' },
        { status: 400 }
      )
    }

    const template = await prisma.formTemplate.create({
      data: {
        facilityId: user.facilityId,
        moduleType,
        name,
        description,
        schema,
        createdBy: user.id,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        newValue: { moduleType, name },
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating form template:', error)
    return NextResponse.json(
      { error: 'Failed to create form template' },
      { status: 500 }
    )
  }
}
