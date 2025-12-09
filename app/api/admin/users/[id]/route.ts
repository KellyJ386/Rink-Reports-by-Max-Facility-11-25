import { NextRequest, NextResponse } from 'next/server'
import { User, PermissionKey } from '@/types/admin'

// Reference to shared storage (in production, this would be a database)
const users = new Map<string, User>()

// Initialize with mock data if empty
const initMockData = () => {
  if (users.size === 0) {
    const mockUser: User = {
      id: 'user-1',
      email: 'admin@icerink.com',
      firstName: 'System',
      lastName: 'Admin',
      phone: '+1 (555) 000-0001',
      avatar: undefined,
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      roleId: 'role-1',
      facilityIds: ['facility-1'],
      facilityId: 'facility-1',
      jobTitle: 'System Administrator',
      department: 'IT',
      employeeId: 'EMP-001',
      hireDate: '2020-01-01',
      failedLoginAttempts: 0,
      requirePasswordChange: false,
      twoFactorEnabled: false,
      permissions: [],
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          push: true,
          sms: false,
          scheduleChanges: true,
          incidentAlerts: true,
          systemUpdates: true,
        },
        dashboardLayout: 'default',
      },
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-25T10:00:00Z',
    }
    users.set(mockUser.id, mockUser)
  }
}

initMockData()

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = users.get(id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = users.get(id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      phone,
      avatar,
      jobTitle,
      department,
      employeeId,
      status,
      roleId,
      facilityId,
      hireDate,
      permissions,
      preferences,
    } = body

    // Check for duplicate email if changed
    if (email && email !== user.email) {
      const existingUser = Array.from(users.values()).find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id
      )
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updatedUser: User = {
      ...user,
      email: email ?? user.email,
      firstName: firstName ?? user.firstName,
      lastName: lastName ?? user.lastName,
      phone: phone !== undefined ? phone : user.phone,
      avatar: avatar !== undefined ? avatar : user.avatar,
      jobTitle: jobTitle !== undefined ? jobTitle : user.jobTitle,
      department: department !== undefined ? department : user.department,
      employeeId: employeeId !== undefined ? employeeId : user.employeeId,
      status: status ?? user.status,
      roleId: roleId ?? user.roleId,
      facilityId: facilityId !== undefined ? facilityId : user.facilityId,
      hireDate: hireDate !== undefined ? hireDate : user.hireDate,
      permissions: permissions ?? user.permissions,
      preferences: preferences
        ? { ...user.preferences, ...preferences }
        : user.preferences,
      updatedAt: new Date().toISOString(),
    }

    users.set(id, updatedUser)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Partial update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = users.get(id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, ...data } = body

    let updatedUser = { ...user }

    switch (action) {
      case 'updateStatus':
        if (!data.status) {
          return NextResponse.json(
            { error: 'Status is required' },
            { status: 400 }
          )
        }
        updatedUser.status = data.status
        break

      case 'updateRole':
        if (!data.roleId) {
          return NextResponse.json(
            { error: 'Role ID is required' },
            { status: 400 }
          )
        }
        updatedUser.roleId = data.roleId
        break

      case 'updatePermissions':
        if (!Array.isArray(data.permissions)) {
          return NextResponse.json(
            { error: 'Permissions array is required' },
            { status: 400 }
          )
        }
        updatedUser.permissions = data.permissions as PermissionKey[]
        break

      case 'updatePreferences':
        updatedUser.preferences = {
          ...updatedUser.preferences,
          ...data.preferences,
        }
        break

      case 'recordLogin':
        updatedUser.lastLoginAt = new Date().toISOString()
        break

      default:
        // Generic partial update
        Object.keys(data).forEach((key) => {
          if (key in updatedUser && key !== 'id' && key !== 'createdAt') {
            (updatedUser as Record<string, unknown>)[key] = data[key]
          }
        })
    }

    updatedUser.updatedAt = new Date().toISOString()
    users.set(id, updatedUser)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error patching user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!users.has(id)) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    users.delete(id)

    return NextResponse.json({ success: true, deleted: id })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
