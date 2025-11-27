import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get a single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getSession()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Users can view their own profile, admins can view any
    const isOwnProfile = currentUser.id === id
    if (!isOwnProfile && !canUserAccess(currentUser, 'admin', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const user = await prisma.user.findFirst({
      where: {
        id,
        facilityId: currentUser.facilityId,
      },
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
          select: { id: true, name: true, permissions: true },
        },
        facility: {
          select: { id: true, name: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getSession()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const isOwnProfile = currentUser.id === id
    const isAdmin = canUserAccess(currentUser, 'admin', 'edit')

    // Users can update their own profile (limited fields), admins can update any
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const existingUser = await prisma.user.findFirst({
      where: { id, facilityId: currentUser.facilityId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { firstName, lastName, phone, email, password, roleId, isActive, smsOptIn, smsPreference, permissionOverrides } = body

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
    }

    // Validate password strength if provided (minimum 8 characters)
    if (password && password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Build update data based on permissions
    const updateData: any = {}

    // Fields any user can update for themselves
    if (firstName) updateData.firstName = firstName
    if (lastName) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn
    if (smsPreference) updateData.smsPreference = smsPreference

    // Password change
    if (password) {
      if (!isOwnProfile && !isAdmin) {
        return NextResponse.json({ error: 'Cannot change another user\'s password' }, { status: 403 })
      }
      updateData.passwordHash = await hashPassword(password)
    }

    // Admin-only fields
    if (isAdmin) {
      if (email && email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email } })
        if (emailTaken) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
        }
        updateData.email = email
      }
      if (roleId) updateData.roleId = roleId
      if (isActive !== undefined) updateData.isActive = isActive
      if (permissionOverrides !== undefined) updateData.permissionOverrides = permissionOverrides
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
        isActive: true,
        role: {
          select: { id: true, name: true },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        previousValue: { firstName: existingUser.firstName, lastName: existingUser.lastName },
        newValue: { firstName: updatedUser.firstName, lastName: updatedUser.lastName },
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Deactivate a user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getSession()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(currentUser, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { id, facilityId: currentUser.facilityId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete - deactivate instead of hard delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE',
        entityType: 'User',
        entityId: id,
        previousValue: { isActive: true },
        newValue: { isActive: false },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
