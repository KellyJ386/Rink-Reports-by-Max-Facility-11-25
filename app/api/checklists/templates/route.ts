import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const facilityId = session.facilityId

    // Get all checklist templates for this facility
    const templates = await prisma.formTemplate.findMany({
      where: {
        facilityId,
        moduleType: 'DAILY_CHECKLIST',
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, items } = body

    if (!name || !items || items.length === 0) {
      return NextResponse.json({ error: 'Name and items are required' }, { status: 400 })
    }

    const facilityId = session.facilityId

    // Check if template with this name already exists
    const existing = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'DAILY_CHECKLIST',
        name
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 400 })
    }

    const template = await prisma.formTemplate.create({
      data: {
        facilityId,
        moduleType: 'DAILY_CHECKLIST',
        name,
        description,
        createdBy: session.id,
        schema: {
          fields: items.map((item: { id: string; label: string; required: boolean }) => ({
            id: item.id,
            type: 'checkbox',
            label: item.label,
            required: item.required
          }))
        }
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, items } = body

    if (!id || !name || !items || items.length === 0) {
      return NextResponse.json({ error: 'ID, name and items are required' }, { status: 400 })
    }

    const facilityId = session.facilityId

    // Check if template exists and belongs to this facility
    const existing = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId,
        moduleType: 'DAILY_CHECKLIST'
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if another template with this name exists
    const duplicate = await prisma.formTemplate.findFirst({
      where: {
        facilityId,
        moduleType: 'DAILY_CHECKLIST',
        name,
        id: { not: id }
      }
    })

    if (duplicate) {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 400 })
    }

    const template = await prisma.formTemplate.update({
      where: { id },
      data: {
        name,
        description,
        version: { increment: 1 },
        schema: {
          fields: items.map((item: { id: string; label: string; required: boolean }) => ({
            id: item.id,
            type: 'checkbox',
            label: item.label,
            required: item.required
          }))
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const facilityId = session.facilityId

    // Check if template exists and belongs to this facility
    const existing = await prisma.formTemplate.findFirst({
      where: {
        id,
        facilityId,
        moduleType: 'DAILY_CHECKLIST'
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Soft delete by marking as inactive
    await prisma.formTemplate.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
