import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/roles/[id] - Get a specific role
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { id } = await params

    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [{ facilityId: user.facilityId }, { isSystemDefault: true }],
      },
      include: {
        _count: { select: { users: true } },
      },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, permissions } = body

    // Check if role exists and belongs to facility
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        OR: [{ facilityId: user.facilityId }, { isSystemDefault: true }],
      },
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (existingRole.isSystemDefault) {
      return NextResponse.json({ error: 'Cannot modify system default roles' }, { status: 403 })
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Role',
        entityId: id,
        newValue: { name },
      },
    })

    return NextResponse.json({ role: updatedRole })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - Delete a custom role
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { id } = await params

    const role = await prisma.role.findFirst({
      where: { id, facilityId: user.facilityId },
      include: { _count: { select: { users: true } } },
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (role.isSystemDefault) {
      return NextResponse.json({ error: 'Cannot delete system default roles' }, { status: 403 })
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users' },
        { status: 400 }
      )
    }

    await prisma.role.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'Role',
        entityId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
