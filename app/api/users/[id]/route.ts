import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        smsOptIn: true,
        smsPreference: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        permissionOverrides: true,
        facilityId: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user belongs to same facility
    if (targetUser.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit users' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      phone,
      roleId,
      smsOptIn,
      smsPreference,
      isActive,
      permissionOverrides,
      newPassword
    } = body

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user belongs to same facility
    if (targetUser.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If changing email, check it's not already taken
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
    }

    // If changing role, verify it's valid
    if (roleId && roleId !== targetUser.roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          OR: [
            { facilityId: user.facilityId },
            { isSystemDefault: true }
          ]
        }
      })
      if (!role) {
        return NextResponse.json(
          { error: 'Invalid role selected' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (email) updateData.email = email.toLowerCase().trim()
    if (firstName) updateData.firstName = firstName.trim()
    if (lastName) updateData.lastName = lastName.trim()
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (roleId) updateData.roleId = roleId
    if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn
    if (smsPreference) updateData.smsPreference = smsPreference
    if (isActive !== undefined) updateData.isActive = isActive
    if (permissionOverrides !== undefined) updateData.permissionOverrides = permissionOverrides

    // Handle password change
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }
      updateData.passwordHash = await hashPassword(newPassword)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        smsOptIn: true,
        smsPreference: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        permissionOverrides: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.delete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete users' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Ensure user belongs to same facility
    if (targetUser.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
