import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    const canManageUsers = canUserAccess(user, 'admin', 'manageUsers')
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const roleId = searchParams.get('roleId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    if (roleId) {
      where.roleId = roleId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    // Remove password hash from response
    const sanitizedUsers = users.map(({ passwordHash, ...rest }) => rest)

    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageUsers = canUserAccess(user, 'admin', 'manageUsers')
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      isActive = true,
    } = body

    if (!email || !password || !firstName || !lastName || !roleId) {
      return NextResponse.json(
        { error: 'email, password, firstName, lastName, and roleId are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Verify role belongs to same facility or is system default
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { facilityId: user.facilityId },
          { isSystemDefault: true },
        ],
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        roleId,
        facilityId: user.facilityId,
        isActive,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'User',
        entityId: newUser.id,
        newValue: {
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          roleId: newUser.roleId,
        },
      },
    })

    const { passwordHash: _, ...sanitizedUser } = newUser

    return NextResponse.json({ user: sanitizedUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
