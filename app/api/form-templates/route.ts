import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List form templates
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')

    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    if (moduleType) {
      where.moduleType = moduleType
    }

    const templates = await prisma.formTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
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
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create form template
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'createTemplates')) {
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

    const template = await prisma.formTemplate.create({
      data: {
        facilityId: user.facilityId,
        moduleType,
        name,
        description,
        schema,
        createdBy: user.id,
        version: 1,
      },
    })

    // Create audit log
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
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
