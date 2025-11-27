import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get single form template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching form template:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT - Update form template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    // Check if template exists and belongs to facility
    const existing = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be modified' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, schema, isActive } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (schema !== undefined) {
      updateData.schema = schema
      updateData.version = existing.version + 1
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const template = await prisma.formTemplate.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        previousValue: { name: existing.name, version: existing.version },
        newValue: { name: template.name, version: template.version },
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating form template:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Delete form template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    // Check if template exists and belongs to facility
    const existing = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be deleted' },
        { status: 403 }
      )
    }

    // Check if there are any submissions using this template
    const submissionCount = await prisma.submission.count({
      where: { formTemplateId: id },
    })

    if (submissionCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'Template deactivated (has existing submissions)',
        deactivated: true,
      })
    }

    // Hard delete if no submissions
    await prisma.formTemplate.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'FormTemplate',
        entityId: id,
        previousValue: { name: existing.name },
      },
    })

    return NextResponse.json({ message: 'Template deleted' })
  } catch (error) {
    console.error('Error deleting form template:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
