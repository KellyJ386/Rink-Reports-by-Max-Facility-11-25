import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/roles/[id] - Get a single role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [
          { facilityId: user.facilityId },
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
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageRoles = canUserAccess(user, 'admin', 'manageRoles')
    if (!canManageRoles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = await prisma.role.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Cannot edit system default roles
    if (role.isSystemDefault) {
      return NextResponse.json(
        { error: 'Cannot edit system default roles' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, permissions } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (permissions !== undefined) updateData.permissions = permissions

    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Role',
        entityId: id,
        previousValue: { name: role.name, description: role.description },
        newValue: updateData,
      },
    })

    return NextResponse.json({ role: updatedRole })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageRoles = canUserAccess(user, 'admin', 'manageRoles')
    if (!canManageRoles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = await prisma.role.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Cannot delete system default roles
    if (role.isSystemDefault) {
      return NextResponse.json(
        { error: 'Cannot delete system default roles' },
        { status: 400 }
      )
    }

    // Cannot delete role with assigned users
    if (role._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Reassign users first.' },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'Role',
        entityId: id,
        previousValue: { name: role.name },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
