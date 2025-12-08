import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/programs/[id] - Get a single program
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const program = await prisma.program.findUnique({
      where: { id }
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    if (program.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}

// PUT /api/programs/[id] - Update a program
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit programs' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.program.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, isActive } = body

    // Check for duplicate name if changing name
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.program.findFirst({
        where: {
          facilityId: user.facilityId,
          name: name.trim(),
          id: { not: id }
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A program with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive

    const program = await prisma.program.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error updating program:', error)
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

// DELETE /api/programs/[id] - Delete a program
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to delete programs' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.program.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    if (existing.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.program.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}
