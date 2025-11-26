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

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const isActive = searchParams.get('isActive')

    const templates = await prisma.formTemplate.findMany({
      where: {
        facilityId: user.facilityId,
        ...(moduleType && { moduleType: moduleType as any }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: [{ moduleType: 'asc' }, { updatedAt: 'desc' }],
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

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.createTemplates) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { moduleType, name, description, schema } = body

    // Validate required fields
    if (!moduleType || !name || !schema) {
      return NextResponse.json(
        { error: 'Missing required fields: moduleType, name, schema' },
        { status: 400 }
      )
    }

    // Validate module type
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
        description: description || null,
        schema,
        createdBy: user.id,
      },
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
