import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/roles - List all roles (system defaults + facility custom)
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { isSystemDefault: true },
          { facilityId: user.facilityId },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        isSystemDefault: true,
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

// POST /api/roles - Create a custom role for the facility
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions } = body

    if (!name || !permissions) {
      return NextResponse.json(
        { error: 'Name and permissions are required' },
        { status: 400 }
      )
    }

    const role = await prisma.role.create({
      data: {
        facilityId: user.facilityId,
        name,
        description,
        permissions,
        isSystemDefault: false,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Role',
        entityId: role.id,
        newValue: { name },
      },
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}
