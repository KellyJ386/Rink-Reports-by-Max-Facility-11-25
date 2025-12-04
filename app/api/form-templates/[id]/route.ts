import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/form-templates/[id]
 * Get a single form template by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      { error: 'Failed to fetch form template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/form-templates/[id]
 * Update a form template
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Check template exists and belongs to facility
    const existingTemplate = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if template is locked
    if (existingTemplate.isLocked) {
      return NextResponse.json(
        { error: 'Template is locked and cannot be edited' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, schema, isActive, conditionalRules, calculatedFields } = body

    // Store previous value for audit
    const previousValue = {
      name: existingTemplate.name,
      description: existingTemplate.description,
      isActive: existingTemplate.isActive,
    }

    // Update template with version increment
    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        name: name ?? existingTemplate.name,
        description: description ?? existingTemplate.description,
        schema: schema ?? existingTemplate.schema,
        isActive: isActive ?? existingTemplate.isActive,
        conditionalRules: conditionalRules ?? existingTemplate.conditionalRules,
        calculatedFields: calculatedFields ?? existingTemplate.calculatedFields,
        version: schema ? existingTemplate.version + 1 : existingTemplate.version,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: template.id,
        previousValue,
        newValue: { name: template.name, description: template.description, isActive: template.isActive },
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating form template:', error)
    return NextResponse.json(
      { error: 'Failed to update form template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/form-templates/[id]
 * Delete a form template (soft delete by deactivating)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    // Check template exists and belongs to facility
    const existingTemplate = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if template is locked
    if (existingTemplate.isLocked) {
      return NextResponse.json(
        { error: 'Template is locked and cannot be deleted' },
        { status: 403 }
      )
    }

    // Check if template has submissions
    const submissionCount = await prisma.submission.count({
      where: { formTemplateId: id },
    })

    if (submissionCount > 0) {
      // Soft delete - just deactivate
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ARCHIVE',
          entityType: 'FormTemplate',
          entityId: id,
          previousValue: { isActive: true },
          newValue: { isActive: false },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Template deactivated (has existing submissions)',
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
        previousValue: { name: existingTemplate.name, moduleType: existingTemplate.moduleType },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form template:', error)
    return NextResponse.json(
      { error: 'Failed to delete form template' },
      { status: 500 }
    )
  }
}
