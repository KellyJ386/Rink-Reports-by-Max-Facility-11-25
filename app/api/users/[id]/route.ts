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
} from '@/lib/api-utils'
import { UpdateUserSchema, ChangePasswordSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get user details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Users can view their own profile, or admins can view anyone in facility
    const isOwnProfile = id === user.id
    const isAdmin = canUserAccess(user, 'admin', 'access')

    if (!isOwnProfile && !isAdmin) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
        smsPreference: true,
        smsOptIn: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        facilityId: true,
        permissionOverrides: isAdmin, // Only show overrides to admins
        role: {
          select: {
            id: true,
            name: true,
            permissions: isAdmin, // Only show permissions to admins
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!targetUser) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
    }

    // Check facility access
    if (targetUser.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    return successResponse(targetUser)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Users can update their own profile (limited fields), or admins can update anyone
    const isOwnProfile = id === user.id
    const isAdmin = canUserAccess(user, 'admin', 'access')

    if (!isOwnProfile && !isAdmin) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    const body = await request.json()
    const data = validateBody(UpdateUserSchema, body)

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Non-admins can only update certain fields on their own profile
    if (!isAdmin) {
      const allowedFields = ['firstName', 'lastName', 'phone', 'smsPreference', 'smsOptIn']
      const updateData: Record<string, unknown> = {}

      for (const field of allowedFields) {
        if (data[field as keyof typeof data] !== undefined) {
          updateData[field] = data[field as keyof typeof data]
        }
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          smsPreference: true,
          smsOptIn: true,
        },
      })

      return successResponse(updated)
    }

    // Admin can update all fields
    // If changing email, check for duplicates
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      })
      if (emailExists) {
        return errorResponse(ErrorCodes.ALREADY_EXISTS, 'A user with this email already exists')
      }
    }

    // If changing role, verify it exists and belongs to facility
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
      })
      if (!role) {
        return errorResponse(ErrorCodes.NOT_FOUND, 'Role not found')
      }
      if (role.facilityId && role.facilityId !== user.facilityId) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'Cannot assign role from another facility')
      }
    }

    const previousValue = {
      email: existing.email,
      firstName: existing.firstName,
      lastName: existing.lastName,
      roleId: existing.roleId,
      isActive: existing.isActive,
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.roleId && { roleId: data.roleId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.smsPreference && { smsPreference: data.smsPreference }),
        ...(data.smsOptIn !== undefined && { smsOptIn: data.smsOptIn }),
        ...(data.permissionOverrides !== undefined && { permissionOverrides: data.permissionOverrides }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        smsPreference: true,
        smsOptIn: true,
        permissionOverrides: true,
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
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        previousValue,
        newValue: data,
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/users/[id] - Deactivate user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    // Require admin access
    if (!canUserAccess(user, 'admin', 'access')) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required')
    }

    const { id } = await params

    // Cannot deactivate yourself
    if (id === user.id) {
      return errorResponse(ErrorCodes.INVALID_INPUT, 'Cannot deactivate your own account')
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
    }

    // Check facility access
    if (existing.facilityId !== user.facilityId) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Access denied')
    }

    // Soft delete - deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'User',
        entityId: id,
        previousValue: { isActive: true },
        newValue: { isActive: false },
      },
    })

    return successResponse({ message: 'User deactivated successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/users/[id] - Change password
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { id } = await params

    // Users can only change their own password
    if (id !== user.id) {
      return errorResponse(ErrorCodes.FORBIDDEN, 'Can only change your own password')
    }

    const body = await request.json()
    const data = validateBody(ChangePasswordSchema, body)

    const existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
    }

    // Verify current password
    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(data.currentPassword, existing.passwordHash)

    if (!isValid) {
      return errorResponse(ErrorCodes.INVALID_INPUT, 'Current password is incorrect')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword)

    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    })

    // Create audit log (don't log password values)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        newValue: { action: 'password_changed' },
      },
    })

    return successResponse({ message: 'Password changed successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
