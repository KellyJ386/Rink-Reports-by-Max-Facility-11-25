import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/forms/[id] - Get a specific form template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching form template:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching form template' },
      { status: 500 }
    )
  }
}

// PUT /api/forms/[id] - Update a form template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingTemplate = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    if (existingTemplate.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be edited' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, schema, conditionalRules, isActive } = body

    // Get previous value for audit log
    const previousValue = {
      name: existingTemplate.name,
      description: existingTemplate.description,
      isActive: existingTemplate.isActive,
    }

    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(schema !== undefined && { schema }),
        ...(conditionalRules !== undefined && { conditionalRules }),
        ...(isActive !== undefined && { isActive }),
        version: { increment: 1 },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        previousValue,
        newValue: { name, description, isActive },
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating form template:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating form template' },
      { status: 500 }
    )
  }
}

// DELETE /api/forms/[id] - Delete a form template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingTemplate = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    if (existingTemplate.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be deleted' },
        { status: 403 }
      )
    }

    // Check if there are submissions using this template
    if (existingTemplate._count.submissions > 0) {
      // Instead of deleting, mark as inactive
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ARCHIVE',
          entityType: 'FormTemplate',
          entityId: id,
        },
      })

      return NextResponse.json({
        message: 'Template has submissions and was archived instead of deleted',
        archived: true,
      })
    }

    // Delete the template
    await prisma.formTemplate.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'FormTemplate',
        entityId: id,
        previousValue: { name: existingTemplate.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form template:', error)
    return NextResponse.json(
      { error: 'An error occurred while deleting form template' },
      { status: 500 }
    )
  }
}
