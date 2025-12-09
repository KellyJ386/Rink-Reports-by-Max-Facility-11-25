import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAdminPermission,
  logAdminAction,
  getClientIP,
  getUserAgent,
} from '@/lib/adminAuth'
import { createRoleSchema } from '@/lib/validations/admin'

// GET /api/admin/roles - List all roles
export async function GET() {
  try {
    const user = await requireAdminPermission('access')

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { facilityId: user.facilityId },
          { isSystemDefault: true },
        ],
      },
      orderBy: [
        { isSystemDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    return NextResponse.json({
      roles: roles.map((role: typeof roles[number]) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystemDefault: role.isSystemDefault,
        permissions: role.permissions,
        userCount: role._count.users,
        canDelete: !role.isSystemDefault && role._count.users === 0,
      })),
    })
  } catch (error) {
    console.error('Error fetching roles:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/admin/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdminPermission('editUsers')

    const body = await request.json()
    const validation = createRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if role name already exists for this facility
    const existingRole = await prisma.role.findFirst({
      where: {
        name: data.name,
        facilityId: adminUser.facilityId,
      },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 400 }
      )
    }

    const newRole = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        facilityId: adminUser.facilityId,
        isSystemDefault: false,
      },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'CREATE',
      'Role',
      newRole.id,
      null,
      { name: newRole.name, description: newRole.description },
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
