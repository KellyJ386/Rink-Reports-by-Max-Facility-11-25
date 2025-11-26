import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/form-templates/[id] - Get a single form template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Ensure template belongs to user's facility
    if (template.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching form template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form template' },
      { status: 500 }
    )
  }
}

// PUT /api/form-templates/[id] - Update a form template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.createTemplates) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if template exists and belongs to user's facility
    const existing = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if template is locked
    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot edit a locked template' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, schema, isActive } = body

    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(schema !== undefined && { schema }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating form template:', error)
    return NextResponse.json(
      { error: 'Failed to update form template' },
      { status: 500 }
    )
  }
}

// DELETE /api/form-templates/[id] - Delete a form template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.delete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if template exists and belongs to user's facility
    const existing = await prisma.formTemplate.findUnique({
      where: { id },
      include: { submissions: { take: 1 } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if template has submissions
    if (existing.submissions.length > 0) {
      // Instead of deleting, deactivate
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        message: 'Template deactivated (has existing submissions)',
      })
    }

    // Delete template
    await prisma.formTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Template deleted' })
  } catch (error) {
    console.error('Error deleting form template:', error)
    return NextResponse.json(
      { error: 'Failed to delete form template' },
      { status: 500 }
    )
  }
}
