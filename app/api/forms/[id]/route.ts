import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/forms/[id] - Get a single form template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const form = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        previousVersion: {
          select: { id: true, version: true },
        },
        nextVersions: {
          select: { id: true, version: true },
        },
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

// PUT /api/forms/[id] - Update a form template (creates new version)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'createTemplates')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const existingForm = await prisma.formTemplate.findFirst({
      where: { id, facilityId: user.facilityId },
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (existingForm.isLocked) {
      return NextResponse.json(
        { error: 'This form is locked and cannot be modified' },
        { status: 403 }
      )
    }

    const { name, description, schema, conditionalRules, calculatedFields, createNewVersion } = body

    // Validate input lengths
    if (name && name.length > 255) {
      return NextResponse.json({ error: 'Name must be 255 characters or less' }, { status: 400 })
    }
    if (description && description.length > 1000) {
      return NextResponse.json({ error: 'Description must be 1000 characters or less' }, { status: 400 })
    }

    // If schema changed and has submissions, create new version
    const hasSubmissions = await prisma.submission.count({
      where: { formTemplateId: id },
    })

    if (createNewVersion || (hasSubmissions > 0 && JSON.stringify(schema) !== JSON.stringify(existingForm.schema))) {
      // Create new version
      const newForm = await prisma.formTemplate.create({
        data: {
          facilityId: user.facilityId,
          name: name || existingForm.name,
          description: description ?? existingForm.description,
          moduleType: existingForm.moduleType,
          schema: schema || existingForm.schema,
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

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'FormTemplate',
          entityId: newForm.id,
          previousValue: { version: existingForm.version },
          newValue: { version: newForm.version },
        },
      })

      return NextResponse.json({ form: newForm, newVersion: true })
    }

    // Update in place
    const updatedForm = await prisma.formTemplate.update({
      where: { id },
      data: {
        name,
        description,
        schema,
        conditionalRules,
        calculatedFields,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'FormTemplate',
        entityId: id,
        previousValue: { name: existingForm.name },
        newValue: { name: updatedForm.name },
      },
    })

    return NextResponse.json({ form: updatedForm, newVersion: false })
  } catch (error) {
    console.error('Error updating form:', error)
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

// DELETE /api/forms/[id] - Archive (soft delete) a form template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const form = await prisma.formTemplate.findFirst({
      where: { id, facilityId: user.facilityId },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Soft delete by deactivating
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
