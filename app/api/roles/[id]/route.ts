import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/roles/[id] - Get single role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Ensure role belongs to same facility or is system default
    if (role.facilityId && role.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      ...role,
      userCount: (role as unknown as { _count: { users: number } })._count.users
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit roles' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, permissions: rolePermissions } = body

    // Find target role
    const targetRole = await prisma.role.findUnique({
      where: { id }
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Cannot edit system default roles
    if (targetRole.isSystemDefault) {
      return NextResponse.json(
        { error: 'Cannot modify system default roles' },
        { status: 403 }
      )
    }

    // Ensure role belongs to same facility
    if (targetRole.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If changing name, check for duplicates
    if (name && name.trim() !== targetRole.name) {
      const existing = await prisma.role.findFirst({
        where: {
          name: name.trim(),
          facilityId: user.facilityId,
          id: { not: id }
        }
      })
      if (existing) {
        return NextResponse.json(
          { error: 'A role with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (rolePermissions) updateData.permissions = rolePermissions

    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.delete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete roles' },
        { status: 403 }
      )
    }

    const { id } = await params

    const targetRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    if (!targetRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Cannot delete system default roles
    if (targetRole.isSystemDefault) {
      return NextResponse.json(
        { error: 'Cannot delete system default roles' },
        { status: 403 }
      )
    }

    // Ensure role belongs to same facility
    if (targetRole.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Cannot delete role if users are assigned
    if ((targetRole as unknown as { _count: { users: number } })._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Reassign users first.' },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
