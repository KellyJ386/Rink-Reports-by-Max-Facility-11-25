import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/form-templates - List all form templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facilityId = searchParams.get('facilityId')
    const moduleType = searchParams.get('moduleType')

    const where: any = {}
    if (facilityId) where.facilityId = facilityId
    if (moduleType) where.moduleType = moduleType

    const templates = await prisma.formTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json({ error: 'Failed to fetch form templates' }, { status: 500 })
  }
}

// POST /api/form-templates - Create a new form template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facilityId, moduleType, name, description, sections } = body

    if (!facilityId || !moduleType || !name || !sections) {
      return NextResponse.json(
        { error: 'facilityId, moduleType, name, and sections are required' },
        { status: 400 }
      )
    }

    // Validate moduleType
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

    // Validate sections structure
    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: 'Sections must be a non-empty array' },
        { status: 400 }
      )
    }

    const template = await prisma.formTemplate.create({
      data: {
        facilityId,
        moduleType,
        name,
        description: description || '',
        sections,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating form template:', error)
    return NextResponse.json({ error: 'Failed to create form template' }, { status: 500 })
  }
}
