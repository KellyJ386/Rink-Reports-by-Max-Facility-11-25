import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/form-templates/[id]/versions - Get version history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the current template
    const template = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (template.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Traverse backwards to find all previous versions
    const versions: Array<{
      id: string
      version: number
      name: string
      createdAt: Date
      updatedAt: Date
      isActive: boolean
      isCurrent: boolean
    }> = []

    // Add current version
    versions.push({
      id: template.id,
      version: template.version,
      name: template.name,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      isActive: template.isActive,
      isCurrent: true,
    })

    // Walk back through previous versions
    let currentVersionId = template.previousVersionId
    while (currentVersionId) {
      const prevVersion = await prisma.formTemplate.findUnique({
        where: { id: currentVersionId },
        select: {
          id: true,
          version: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          previousVersionId: true,
        },
      })

      if (!prevVersion) break

      versions.push({
        id: prevVersion.id,
        version: prevVersion.version,
        name: prevVersion.name,
        createdAt: prevVersion.createdAt,
        updatedAt: prevVersion.updatedAt,
        isActive: prevVersion.isActive,
        isCurrent: false,
      })

      currentVersionId = prevVersion.previousVersionId
    }

    // Sort by version descending (newest first)
    versions.sort((a, b) => b.version - a.version)

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error fetching version history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    )
  }
}

// POST /api/form-templates/[id]/versions - Create a new version
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.createTemplates) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Get the current template
    const existing = await prisma.formTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { schema, name, description } = body

    if (!schema) {
      return NextResponse.json(
        { error: 'Schema is required for new version' },
        { status: 400 }
      )
    }

    // Create new version as a new record linked to the previous
    const newVersion = await prisma.formTemplate.create({
      data: {
        facilityId: existing.facilityId,
        moduleType: existing.moduleType,
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        version: existing.version + 1,
        isActive: true, // New version is active
        isLocked: false,
        schema,
        conditionalRules: body.conditionalRules || existing.conditionalRules,
        calculatedFields: body.calculatedFields || existing.calculatedFields,
        createdBy: user.id,
        previousVersionId: existing.id,
      },
    })

    // Optionally deactivate the old version
    await prisma.formTemplate.update({
      where: { id: existing.id },
      data: { isActive: false },
    })

    return NextResponse.json(newVersion, { status: 201 })
  } catch (error) {
    console.error('Error creating new version:', error)
    return NextResponse.json(
      { error: 'Failed to create new version' },
      { status: 500 }
    )
  }
}
