import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAdminPermission,
  logAdminAction,
  getClientIP,
  getUserAgent,
} from '@/lib/adminAuth'
import { updateFormTemplateSchema } from '@/lib/validations/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/forms/[id] - Get a single form template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('access')
    const { id } = await params

    const form = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...form,
      submissionCount: form._count.submissions,
      _count: undefined,
    })
  } catch (error) {
    console.error('Error fetching form:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/forms/[id] - Update a form template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editForms')
    const { id } = await params

    const existingForm = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
    })

    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    if (existingForm.isLocked) {
      return NextResponse.json(
        { error: 'This form is locked and cannot be modified' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateFormTemplateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const updatedForm = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.schema && { schema: data.schema }),
      },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'UPDATE',
      'FormTemplate',
      id,
      existingForm,
      updatedForm,
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json(updatedForm)
  } catch (error) {
    console.error('Error updating form:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/forms/[id] - Archive (soft delete) a form template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editForms')
    const { id } = await params

    const existingForm = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    if (existingForm.isLocked) {
      return NextResponse.json(
        { error: 'This form is locked and cannot be deleted' },
        { status: 403 }
      )
    }

    // Soft delete by deactivating
    await prisma.formTemplate.update({
      where: { id },
      data: { isActive: false },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'ARCHIVE',
      'FormTemplate',
      id,
      { isActive: true },
      { isActive: false },
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/forms/[id] - Publish a new version
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editForms')
    const { id } = await params

    const existingForm = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
    })

    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'publish') {
      // Create a new version by incrementing and linking to previous
      const newVersion = await prisma.formTemplate.create({
        data: {
          facilityId: adminUser.facilityId,
          moduleType: existingForm.moduleType,
          name: existingForm.name,
          description: existingForm.description,
          schema: existingForm.schema,
          version: existingForm.version + 1,
          isActive: true,
          createdBy: adminUser.id,
          previousVersionId: existingForm.id,
        },
      })

      // Deactivate the old version
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      // Log the action
      await logAdminAction(
        adminUser.id,
        'CREATE',
        'FormTemplate',
        newVersion.id,
        { previousVersion: existingForm.version },
        { newVersion: newVersion.version },
        getClientIP(request.headers),
        getUserAgent(request.headers)
      )

      return NextResponse.json(newVersion)
    } else if (action === 'activate') {
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: true },
      })

      return NextResponse.json({ success: true })
    } else if (action === 'deactivate') {
      await prisma.formTemplate.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error with form action:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}
