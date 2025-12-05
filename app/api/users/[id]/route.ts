import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get a single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageUsers = canUserAccess(user, 'admin', 'manageUsers')
    // Allow users to view their own profile
    if (!canManageUsers && id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify same facility
    if (targetUser.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { passwordHash, ...sanitizedUser } = targetUser

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageUsers = canUserAccess(user, 'admin', 'manageUsers')
    const isOwnProfile = id === user.id

    // Users can update limited fields on their own profile
    if (!canManageUsers && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser || targetUser.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      isActive,
      smsOptIn,
      smsPreference,
    } = body

    // Build update data based on permissions
    const updateData: Record<string, unknown> = {}

    // Fields any user can update on their own profile
    if (isOwnProfile || canManageUsers) {
      if (firstName !== undefined) updateData.firstName = firstName
      if (lastName !== undefined) updateData.lastName = lastName
      if (phone !== undefined) updateData.phone = phone
      if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn
      if (smsPreference !== undefined) updateData.smsPreference = smsPreference
    }

    // Fields only admins can update
    if (canManageUsers) {
      if (email !== undefined) {
        // Check if email is taken by another user
        if (email !== targetUser.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          })
          if (existingUser) {
            return NextResponse.json(
              { error: 'A user with this email already exists' },
              { status: 400 }
            )
          }
        }
        updateData.email = email
      }

      if (password) {
        updateData.passwordHash = await hashPassword(password)
      }

      if (roleId !== undefined) {
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
        updateData.roleId = roleId
      }

      if (isActive !== undefined) {
        // Prevent deactivating yourself
        if (id === user.id && !isActive) {
          return NextResponse.json(
            { error: 'Cannot deactivate your own account' },
            { status: 400 }
          )
        }
        updateData.isActive = isActive
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        previousValue: {
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          roleId: targetUser.roleId,
          isActive: targetUser.isActive,
        },
        newValue: updateData,
      },
    })

    const { passwordHash, ...sanitizedUser } = updatedUser

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Deactivate a user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageUsers = canUserAccess(user, 'admin', 'manageUsers')
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser || targetUser.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete by deactivating
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
        previousValue: {
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          isActive: targetUser.isActive,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
