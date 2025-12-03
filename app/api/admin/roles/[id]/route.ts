import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAdminPermission,
  logAdminAction,
  getClientIP,
  getUserAgent,
} from '@/lib/adminAuth'
import { updateRoleSchema } from '@/lib/validations/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/roles/[id] - Get a single role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('access')
    const { id } = await params

    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [
          { facilityId: adminUser.facilityId },
          { isSystemDefault: true },
        ],
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystemDefault: role.isSystemDefault,
      permissions: role.permissions,
      userCount: role._count.users,
      canDelete: !role.isSystemDefault && role._count.users === 0,
    })
  } catch (error) {
    console.error('Error fetching role:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editUsers')
    const { id } = await params

    // Check if role exists and belongs to this facility (and is not system default)
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
    })

    if (!existingRole) {
      // Check if it's a system default role
      const systemRole = await prisma.role.findFirst({
        where: { id, isSystemDefault: true },
      })

      if (systemRole) {
        return NextResponse.json(
          { error: 'Cannot modify system default roles' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = updateRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if new name conflicts with existing role
    if (data.name && data.name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: {
          name: data.name,
          facilityId: adminUser.facilityId,
          id: { not: id },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A role with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissions && { permissions: data.permissions }),
      },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'UPDATE',
      'Role',
      id,
      existingRole,
      updatedRole,
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('Error updating role:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editUsers')
    const { id } = await params

    // Check if role exists
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!existingRole) {
      // Check if it's a system default role
      const systemRole = await prisma.role.findFirst({
        where: { id, isSystemDefault: true },
      })

      if (systemRole) {
        return NextResponse.json(
          { error: 'Cannot delete system default roles' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Check if any users are assigned to this role
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Reassign users first.' },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'DELETE',
      'Role',
      id,
      existingRole,
      null,
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
