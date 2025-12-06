import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import type { PermissionSet } from '@/types'

// Default permission set for new roles
const DEFAULT_PERMISSIONS: PermissionSet = {
  admin: { access: false },
  iceDepth: { access: false },
  iceOperations: { access: false },
  refrigeration: { access: false },
  airQuality: { access: false },
  incidents: { access: false },
  schedule: { access: false },
  dailyChecklist: { access: false }
}

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeSystemDefaults = searchParams.get('includeSystem') === 'true'

    const where: Record<string, unknown> = {
      OR: [
        { facilityId: user.facilityId }
      ]
    }

    if (includeSystemDefaults) {
      (where.OR as Record<string, unknown>[]).push({ isSystemDefault: true })
    }

    const roles = await prisma.role.findMany({
      where,
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { isSystemDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    // Transform to include user count
    const rolesWithCount = roles.map((role: typeof roles[number]) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystemDefault: role.isSystemDefault,
      facilityId: role.facilityId,
      userCount: (role as unknown as { _count: { users: number } })._count.users,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt
    }))

    return NextResponse.json(rolesWithCount)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to create roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, permissions: rolePermissions } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name in same facility
    const existing = await prisma.role.findFirst({
      where: {
        name: name.trim(),
        facilityId: user.facilityId
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 400 }
      )
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        facilityId: user.facilityId,
        permissions: rolePermissions || DEFAULT_PERMISSIONS,
        isSystemDefault: false
      }
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
