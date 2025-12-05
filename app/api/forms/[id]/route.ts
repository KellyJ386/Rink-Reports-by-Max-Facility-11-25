import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/forms/[id] - Get a specific form template
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const form = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Check if form belongs to user's facility
    if (form.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    )
  }
}

// PUT /api/forms/[id] - Update a form template
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const existingForm = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (existingForm.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, schema, conditionalRules, calculatedFields, isActive } = body

    // If form has submissions, create a new version instead of updating
    const hasSubmissions = existingForm._count.submissions > 0

    if (hasSubmissions && schema) {
      // Create new version
      const newForm = await prisma.formTemplate.create({
        data: {
          facilityId: user.facilityId,
          name: name || existingForm.name,
          description: description ?? existingForm.description,
          moduleType: existingForm.moduleType,
          schema,
          conditionalRules: conditionalRules ?? existingForm.conditionalRules,
          calculatedFields: calculatedFields ?? existingForm.calculatedFields,
          createdBy: user.id,
          version: existingForm.version + 1,
          previousVersionId: existingForm.id,
        },
      })

      // Deactivate old version
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          facilityId: user.facilityId,
          userId: user.id,
          action: 'CREATE_FORM_VERSION',
          entityType: 'FormTemplate',
          entityId: newForm.id,
          details: {
            previousVersion: existingForm.version,
            newVersion: newForm.version,
            previousId: existingForm.id
          },
        },
      })

      return NextResponse.json({ form: newForm, versioned: true })
    }

    // No submissions, safe to update in place
    const updatedForm = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(schema && { schema }),
        ...(conditionalRules !== undefined && { conditionalRules }),
        ...(calculatedFields !== undefined && { calculatedFields }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        facilityId: user.facilityId,
        userId: user.id,
        action: 'UPDATE_FORM_TEMPLATE',
        entityType: 'FormTemplate',
        entityId: updatedForm.id,
        details: { name: updatedForm.name },
      },
    })

    return NextResponse.json({ form: updatedForm, versioned: false })
  } catch (error) {
    console.error('Error updating form:', error)
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

// DELETE /api/forms/[id] - Delete a form template
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const form = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (form.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If form has submissions, don't delete, just deactivate
    if (form._count.submissions > 0) {
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      await prisma.auditLog.create({
        data: {
          facilityId: user.facilityId,
          userId: user.id,
          action: 'DEACTIVATE_FORM_TEMPLATE',
          entityType: 'FormTemplate',
          entityId: form.id,
          details: { name: form.name, reason: 'Has submissions' },
        },
      })

      return NextResponse.json({
        message: 'Form deactivated (has existing submissions)',
        deactivated: true
      })
    }

    // No submissions, safe to delete
    await prisma.formTemplate.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        facilityId: user.facilityId,
        userId: user.id,
        action: 'DELETE_FORM_TEMPLATE',
        entityType: 'FormTemplate',
        entityId: form.id,
        details: { name: form.name },
      },
    })

    return NextResponse.json({ message: 'Form deleted successfully' })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
