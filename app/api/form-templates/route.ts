import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/form-templates - List all form templates for the user's facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const activeOnly = searchParams.get('active') === 'true'

    const where: any = {
      facilityId: user.facilityId
    }

    if (moduleType) {
      where.moduleType = moduleType
    }

    if (activeOnly) {
      where.isActive = true
    }

    const templates = await prisma.formTemplate.findMany({
      where,
      orderBy: [
        { moduleType: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        facilityId: true,
        moduleType: true,
        name: true,
        description: true,
        version: true,
        isActive: true,
        isLocked: true,
        schema: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form templates' },
      { status: 500 }
    )
  }
}

// POST /api/form-templates - Create a new form template
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json(
        { error: 'You do not have permission to create form templates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, moduleType, schema } = body

    // Validate required fields
    if (!name || !moduleType || !schema) {
      return NextResponse.json(
        { error: 'Name, moduleType, and schema are required' },
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
      'DAILY_CHECKLIST'
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
        version: 1,
        isActive: true,
        isLocked: false,
        schema,
        createdBy: user.id
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating form template:', error)
    return NextResponse.json(
      { error: 'Failed to create form template' },
      { status: 500 }
    )
  }
}
