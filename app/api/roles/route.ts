import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/roles - List roles
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { facilityId: user.facilityId },
          { isSystemDefault: true },
        ],
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(roles)
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
    if (!permissions.admin?.manageRoles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions: rolePermissions } = body

    if (!name || !rolePermissions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, permissions' },
        { status: 400 }
      )
    }

    const role = await prisma.role.create({
      data: {
        facilityId: user.facilityId,
        name,
        description: description || null,
        permissions: rolePermissions,
        isSystemDefault: false,
      },
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
