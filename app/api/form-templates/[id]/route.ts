import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/form-templates/[id] - Get a specific form template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const template = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching form template:', error)
    return NextResponse.json({ error: 'Failed to fetch form template' }, { status: 500 })
  }
}

// PATCH /api/form-templates/[id] - Update a form template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, sections, moduleType } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (sections !== undefined) {
      if (!Array.isArray(sections) || sections.length === 0) {
        return NextResponse.json(
          { error: 'Sections must be a non-empty array' },
          { status: 400 }
        )
      }
      updateData.sections = sections
    }
    if (moduleType !== undefined) {
      const validModuleTypes = [
        'ICE_DEPTH',
        'REFRIGERATION',
        'AIR_QUALITY',
        'INCIDENT',
        'DAILY_CHECKLIST',
        'CUSTOM',
      ]
      if (!validModuleTypes.includes(moduleType)) {
        return NextResponse.json({ error: 'Invalid module type' }, { status: 400 })
      }
      updateData.moduleType = moduleType
    }

    const template = await prisma.formTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating form template:', error)
    return NextResponse.json({ error: 'Failed to update form template' }, { status: 500 })
  }
}

// DELETE /api/form-templates/[id] - Delete a form template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if template is in use
    const submissionsCount = await prisma.submission.count({
      where: { formTemplateId: id },
    })

    if (submissionsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template. It has ${submissionsCount} submission(s). Consider archiving instead.`,
        },
        { status: 400 }
      )
    }

    await prisma.formTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting form template:', error)
    return NextResponse.json({ error: 'Failed to delete form template' }, { status: 500 })
  }
}
