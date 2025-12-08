import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/form-templates/[id] - Get a single form template
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const template = await prisma.formTemplate.findUnique({
      where: { id },
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
        conditionalRules: true,
        calculatedFields: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Ensure user can only access templates from their facility
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
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json(
        { error: 'You do not have permission to edit form templates' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Get existing template
    const existing = await prisma.formTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if locked
    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be edited' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, schema, isActive, conditionalRules, calculatedFields } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (schema !== undefined) updateData.schema = schema
    if (isActive !== undefined) updateData.isActive = isActive
    if (conditionalRules !== undefined) updateData.conditionalRules = conditionalRules
    if (calculatedFields !== undefined) updateData.calculatedFields = calculatedFields

    const template = await prisma.formTemplate.update({
      where: { id },
      data: updateData
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
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json(
        { error: 'You do not have permission to delete form templates' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Get existing template
    const existing = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if locked
    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'This template is locked and cannot be deleted' },
        { status: 403 }
      )
    }

    // Check for existing submissions
    if (existing._count.submissions > 0) {
      return NextResponse.json(
        { error: `Cannot delete template with ${existing._count.submissions} existing submissions. Deactivate instead.` },
        { status: 400 }
      )
    }

    await prisma.formTemplate.delete({
      where: { id }
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

// PATCH /api/form-templates/[id] - Publish a new version
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json(
        { error: 'You do not have permission to publish form templates' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    // Get existing template
    const existing = await prisma.formTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'publish') {
      // Create a new version of the template
      const newTemplate = await prisma.formTemplate.create({
        data: {
          facilityId: existing.facilityId,
          moduleType: existing.moduleType,
          name: existing.name,
          description: existing.description,
          version: existing.version + 1,
          isActive: true,
          isLocked: false,
          schema: existing.schema,
          conditionalRules: existing.conditionalRules,
          calculatedFields: existing.calculatedFields,
          createdBy: user.id,
          previousVersionId: existing.id
        }
      })

      // Deactivate the old version
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json(newTemplate)
    }

    if (action === 'duplicate') {
      // Create a copy of the template
      const duplicatedTemplate = await prisma.formTemplate.create({
        data: {
          facilityId: existing.facilityId,
          moduleType: existing.moduleType,
          name: `${existing.name} (Copy)`,
          description: existing.description,
          version: 1,
          isActive: false, // Start as inactive so admin can review
          isLocked: false,
          schema: existing.schema,
          conditionalRules: existing.conditionalRules,
          calculatedFields: existing.calculatedFields,
          createdBy: user.id
        }
      })

      return NextResponse.json(duplicatedTemplate)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error publishing form template:', error)
    return NextResponse.json(
      { error: 'Failed to publish form template' },
      { status: 500 }
    )
  }
}
