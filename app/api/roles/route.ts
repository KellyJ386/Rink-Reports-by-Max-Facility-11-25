import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/roles - List all roles (system defaults + facility custom)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || 20)) : undefined
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam) || 0) : undefined
    const search = searchParams.get('search')

    const where = {
      OR: [
        { isSystemDefault: true },
        { facilityId: user.facilityId },
      ],
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
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
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.role.count({ where }),
    ])

    return NextResponse.json({ roles, total, ...(limit !== undefined && { limit, offset: offset || 0 }) })
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

    // Validate input lengths
    if (name.length > 100) {
      return NextResponse.json({ error: 'Role name must be 100 characters or less' }, { status: 400 })
    }
    if (description && description.length > 500) {
      return NextResponse.json({ error: 'Description must be 500 characters or less' }, { status: 400 })
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
