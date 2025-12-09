import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/forms/templates/[id] - Get single template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: session.user.facilityId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// PUT /api/forms/templates/[id] - Update template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canAccess = await canUserAccess(session.user.id, 'admin', 'createTemplates')
    if (!canAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: session.user.facilityId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot edit locked template' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, schema, conditionalRules, calculatedFields, isActive } = body

    // If schema changes and there are submissions, create new version
    const hasSubmissions = await prisma.submission.count({
      where: { formTemplateId: id },
    })

    let updatedTemplate

    if (hasSubmissions > 0 && schema && JSON.stringify(schema) !== JSON.stringify(existing.schema)) {
      // Create new version, link to previous
      updatedTemplate = await prisma.formTemplate.create({
        data: {
          facilityId: session.user.facilityId,
          name: name || existing.name,
          description: description ?? existing.description,
          moduleType: existing.moduleType,
          schema: schema || existing.schema,
          conditionalRules: conditionalRules ?? existing.conditionalRules,
          calculatedFields: calculatedFields ?? existing.calculatedFields,
          version: existing.version + 1,
          previousVersionId: existing.id,
          createdBy: session.user.id,
        },
      })

      // Deactivate old version
      await prisma.formTemplate.update({
        where: { id: existing.id },
        data: { isActive: false },
      })
    } else {
      // Simple update
      updatedTemplate = await prisma.formTemplate.update({
        where: { id },
        data: {
          name,
          description,
          schema,
          conditionalRules,
          calculatedFields,
          isActive,
        },
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: updatedTemplate.id,
        previousValue: { name: existing.name, version: existing.version },
        newValue: { name: updatedTemplate.name, version: updatedTemplate.version },
      },
    })

    return NextResponse.json({ template: updatedTemplate })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/forms/templates/[id] - Delete template (soft delete by deactivating)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canAccess = await canUserAccess(session.user.id, 'admin', 'delete')
    if (!canAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: session.user.facilityId,
      },
      include: {
        _count: { select: { submissions: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot delete locked template' },
        { status: 403 }
      )
    }

    // If has submissions, soft delete (deactivate)
    if (existing._count.submissions > 0) {
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })
    } else {
      // Hard delete if no submissions
      await prisma.formTemplate.delete({
        where: { id },
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'FormTemplate',
        entityId: id,
        previousValue: { name: existing.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
