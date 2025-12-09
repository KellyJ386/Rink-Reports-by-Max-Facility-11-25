import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import {
  requireAdminPermission,
  logAdminAction,
  getClientIP,
  getUserAgent,
} from '@/lib/adminAuth'
import { updateUserSchema, resetPasswordSchema } from '@/lib/validations/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/users/[id] - Get a single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('access')
    const { id } = await params

    const user = await prisma.user.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        smsOptIn: true,
        smsPreference: true,
        permissionOverrides: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editUsers')
    const { id } = await params

    // Check if user exists and belongs to the same facility
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // If email is being changed, check it's not already in use
    if (data.email && data.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // If role is being changed, verify it exists
    if (data.roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: data.roleId,
          OR: [
            { facilityId: adminUser.facilityId },
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
    }

    // Prevent admin from deactivating themselves
    if (id === adminUser.id && data.isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.roleId && { roleId: data.roleId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.smsOptIn !== undefined && { smsOptIn: data.smsOptIn }),
        ...(data.smsPreference && { smsPreference: data.smsPreference }),
        ...(data.permissionOverrides !== undefined && {
          permissionOverrides: data.permissionOverrides,
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        smsOptIn: true,
        smsPreference: true,
        permissionOverrides: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'UPDATE',
      'User',
      id,
      existingUser,
      updatedUser,
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Deactivate a user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editUsers')
    const { id } = await params

    // Check if user exists and belongs to the same facility
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    // Log the action
    await logAdminAction(
      adminUser.id,
      'DELETE',
      'User',
      id,
      { isActive: true },
      { isActive: false },
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Reset user password
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const adminUser = await requireAdminPermission('editUsers')
    const { id } = await params

    // Check if user exists and belongs to the same facility
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        facilityId: adminUser.facilityId,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(validation.data.password)

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })

    // Log the action (without including password in the log)
    await logAdminAction(
      adminUser.id,
      'UPDATE',
      'User',
      id,
      { action: 'password_reset_initiated' },
      { action: 'password_reset_completed' },
      getClientIP(request.headers),
      getUserAgent(request.headers)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting password:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
