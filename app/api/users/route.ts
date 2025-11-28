import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/users - List all users in the facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    const active = searchParams.get('active')
    const search = searchParams.get('search')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || 20)) : undefined
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam) || 0) : undefined

    const where = {
      facilityId: user.facilityId,
      ...(roleId && { roleId }),
      ...(active !== null && { isActive: active === 'true' }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          role: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, ...(limit !== undefined && { limit, offset: offset || 0 }) })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission for editing users
    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'No permission to create users' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, firstName, lastName, phone, roleId, smsOptIn, smsPreference } = body

    if (!email || !password || !firstName || !lastName || !roleId) {
      return NextResponse.json(
        { error: 'Email, password, firstName, lastName, and roleId are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Validate name lengths
    if (firstName.length > 100) {
      return NextResponse.json({ error: 'First name must be 100 characters or less' }, { status: 400 })
    }
    if (lastName.length > 100) {
      return NextResponse.json({ error: 'Last name must be 100 characters or less' }, { status: 400 })
    }

    // Validate phone number length if provided
    if (phone && phone.length > 20) {
      return NextResponse.json({ error: 'Phone number must be 20 characters or less' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    // Verify role exists and belongs to facility or is system default
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
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        facilityId: user.facilityId,
        roleId,
        smsOptIn: smsOptIn || false,
        smsPreference: smsPreference || 'CRITICAL_ONLY',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        role: {
          select: { id: true, name: true },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'User',
        entityId: newUser.id,
        newValue: { email, firstName, lastName, role: role.name },
      },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
