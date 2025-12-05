import { NextRequest, NextResponse } from 'next/server'
import {
  User,
  UserStatus,
  UserInvitation,
  SYSTEM_ROLES,
} from '@/types/admin'

// In-memory storage for demo
const users = new Map<string, User>()
const invitations = new Map<string, UserInvitation>()

// Initialize with mock data
const initMockData = () => {
  if (users.size === 0) {
    const mockUsers: User[] = [
      {
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
      },
      {
        id: 'user-2',
        email: 'manager@icerink.com',
        firstName: 'Jane',
        lastName: 'Manager',
        phone: '+1 (555) 000-0002',
        avatar: undefined,
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        roleId: 'role-2',
        facilityIds: ['facility-1'],
        facilityId: 'facility-1',
        jobTitle: 'Facility Manager',
        department: 'Operations',
        employeeId: 'EMP-002',
        hireDate: '2021-03-15',
        failedLoginAttempts: 0,
        requirePasswordChange: false,
        twoFactorEnabled: false,
        permissions: [],
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'America/New_York',
          notifications: {
            email: true,
            push: true,
            sms: true,
            scheduleChanges: true,
            incidentAlerts: true,
            systemUpdates: false,
          },
          dashboardLayout: 'default',
        },
        createdAt: '2021-03-15T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-25T08:30:00Z',
      },
      {
        id: 'user-3',
        email: 'tech@icerink.com',
        firstName: 'John',
        lastName: 'Technician',
        phone: '+1 (555) 000-0003',
        avatar: undefined,
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        roleId: 'role-4',
        facilityIds: ['facility-1'],
        facilityId: 'facility-1',
        jobTitle: 'Ice Technician',
        department: 'Maintenance',
        employeeId: 'EMP-003',
        hireDate: '2022-06-01',
        failedLoginAttempts: 0,
        requirePasswordChange: false,
        twoFactorEnabled: false,
        permissions: [],
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'America/New_York',
          notifications: {
            email: true,
            push: false,
            sms: false,
            scheduleChanges: true,
            incidentAlerts: true,
            systemUpdates: false,
          },
          dashboardLayout: 'default',
        },
        createdAt: '2022-06-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-24T16:45:00Z',
      },
    ]

    mockUsers.forEach((user) => users.set(user.id, user))
  }
}

initMockData()

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as UserStatus | null
    const roleId = searchParams.get('roleId')
    const facilityId = searchParams.get('facilityId')
    const search = searchParams.get('search')?.toLowerCase()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let usersList = Array.from(users.values())

    // Apply filters
    if (status) {
      usersList = usersList.filter((u) => u.status === status)
    }
    if (roleId) {
      usersList = usersList.filter((u) => u.roleId === roleId)
    }
    if (facilityId) {
      usersList = usersList.filter((u) => u.facilityId === facilityId)
    }
    if (search) {
      usersList = usersList.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.jobTitle?.toLowerCase().includes(search)
      )
    }

    // Sort by name
    usersList.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    )

    // Pagination
    const total = usersList.length
    const startIndex = (page - 1) * limit
    const paginatedUsers = usersList.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      phone,
      jobTitle,
      department,
      employeeId,
      roleId,
      facilityId,
      hireDate,
      sendInvitation = true,
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName, roleId' },
        { status: 400 }
      )
    }

    // Check for duplicate email
    const existingUser = Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      firstName,
      lastName,
      phone: phone || undefined,
      avatar: undefined,
      status: sendInvitation ? 'PENDING' : 'ACTIVE',
      emailVerified: false,
      phoneVerified: false,
      roleId,
      facilityIds: facilityId ? [facilityId] : [],
      facilityId: facilityId || undefined,
      jobTitle: jobTitle || undefined,
      department: department || undefined,
      employeeId: employeeId || undefined,
      hireDate: hireDate || undefined,
      failedLoginAttempts: 0,
      requirePasswordChange: true,
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
          systemUpdates: false,
        },
        dashboardLayout: 'default',
      },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: undefined,
    }

    users.set(newUser.id, newUser)

    // Create invitation if requested
    if (sendInvitation) {
      const invitation: UserInvitation = {
        id: `invite-${Date.now()}`,
        email: newUser.email,
        roleId: newUser.roleId,
        facilityId: newUser.facilityId || undefined,
        invitedBy: 'system', // Would come from auth context
        invitedAt: now,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        token: `token-${Math.random().toString(36).substring(7)}`,
      }
      invitations.set(invitation.id, invitation)
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users - Bulk update users
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds, updates } = body as {
      userIds: string[]
      updates: Partial<Pick<User, 'status' | 'roleId' | 'facilityId'>>
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds array is required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const updatedUsers: User[] = []

    userIds.forEach((id) => {
      const user = users.get(id)
      if (user) {
        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: now,
        }
        users.set(id, updatedUser)
        updatedUsers.push(updatedUser)
      }
    })

    return NextResponse.json({
      updated: updatedUsers.length,
      users: updatedUsers,
    })
  } catch (error) {
    console.error('Error bulk updating users:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update users' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users - Bulk delete users
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids query parameter is required' },
        { status: 400 }
      )
    }

    const userIds = idsParam.split(',')
    let deleted = 0

    userIds.forEach((id) => {
      if (users.has(id)) {
        users.delete(id)
        deleted++
      }
    })

    return NextResponse.json({ deleted })
  } catch (error) {
    console.error('Error deleting users:', error)
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    )
  }
}
