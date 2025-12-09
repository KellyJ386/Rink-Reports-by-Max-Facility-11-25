import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  validateBody,
  parsePagination,
  createPaginatedResponse,
} from '@/lib/api-utils'
import { CreateUserSchema } from '@/lib/validations'

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access to list users
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)

    // Build where clause
    const where: Record<string, unknown> = {
      facilityId: user.facilityId,
    }

    // Filter by role
    const roleId = searchParams.get('roleId')
    if (roleId) {
      where.roleId = roleId
    }

    // Filter by active status
    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Search by name or email
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        smsPreference: true,
        smsOptIn: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: pagination.offset,
      take: pagination.limit,
    })

    return successResponse(createPaginatedResponse(users, total, pagination))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access to create users
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const body = await request.json()
    const data = validateBody(CreateUserSchema, body)

    // Verify creating user in same facility
    if (data.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Cannot create users in other facilities')
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return errorResponse(ErrorCodes.ALREADY_EXISTS, 'A user with this email already exists')
    }

    // Verify role exists and belongs to facility (or is system default)
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    })

    if (!role) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Role not found')
    }

    if (role.facilityId && role.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Cannot assign role from another facility')
    }

    // Hash password
    const passwordHash = await hashPassword(data.password)

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        facilityId: data.facilityId,
        roleId: data.roleId,
        smsPreference: data.smsPreference,
        permissionOverrides: data.permissionOverrides,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        smsPreference: true,
        createdAt: true,
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
        newValue: { email: newUser.email, role: role.name },
      },
    })

    return successResponse(newUser, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
