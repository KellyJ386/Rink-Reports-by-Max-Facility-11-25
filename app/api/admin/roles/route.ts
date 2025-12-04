import { NextRequest, NextResponse } from 'next/server'
import { Role, RoleType, PermissionKey, SYSTEM_ROLES } from '@/types/admin'

// In-memory storage for demo
const roles = new Map<string, Role>()

// Initialize with system roles
const initSystemRoles = () => {
  if (roles.size === 0) {
    SYSTEM_ROLES.forEach((role, index) => {
      const fullRole: Role = {
        ...role,
        id: `role-${index + 1}`,
        userCount: [2, 3, 5, 12, 8, 4][index] || 0,
        createdAt: '2022-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
      roles.set(fullRole.id, fullRole)
    })
  }
}

initSystemRoles()

// GET /api/admin/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as RoleType | null
    const includeUserCount = searchParams.get('includeUserCount') === 'true'

    let rolesList = Array.from(roles.values())

    // Filter by type if specified
    if (type) {
      rolesList = rolesList.filter((r) => r.type === type)
    }

    // Sort: system roles first, then by name
    rolesList.sort((a, b) => {
      if (a.type === 'SYSTEM' && b.type !== 'SYSTEM') return -1
      if (a.type !== 'SYSTEM' && b.type === 'SYSTEM') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      roles: rolesList,
      total: rolesList.length,
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      description,
      type = 'CUSTOM',
      permissions = [],
      color = '#3b82f6',
      icon = 'shield',
      isDefault = false,
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existingRole = Array.from(roles.values()).find(
      (r) => r.slug.toLowerCase() === slug.toLowerCase()
    )
    if (existingRole) {
      return NextResponse.json(
        { error: 'A role with this slug already exists' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      roles.forEach((role) => {
        if (role.isDefault) {
          roles.set(role.id, { ...role, isDefault: false })
        }
      })
    }

    const now = new Date().toISOString()
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name,
      slug,
      description: description || '',
      type: type as RoleType,
      permissions: permissions as PermissionKey[],
      color,
      icon,
      isDefault,
      userCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    roles.set(newRole.id, newRole)

    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/roles - Update role (by ID in body)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    const role = roles.get(id)
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Prevent modifying system role type
    if (role.type === 'SYSTEM' && updates.type && updates.type !== 'SYSTEM') {
      return NextResponse.json(
        { error: 'Cannot change type of system role' },
        { status: 400 }
      )
    }

    // Check for duplicate slug if changed
    if (updates.slug && updates.slug !== role.slug) {
      const existingRole = Array.from(roles.values()).find(
        (r) => r.slug.toLowerCase() === updates.slug.toLowerCase() && r.id !== id
      )
      if (existingRole) {
        return NextResponse.json(
          { error: 'A role with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // If setting as default, unset other defaults
    if (updates.isDefault && !role.isDefault) {
      roles.forEach((r) => {
        if (r.isDefault && r.id !== id) {
          roles.set(r.id, { ...r, isDefault: false })
        }
      })
    }

    const updatedRole: Role = {
      ...role,
      name: updates.name ?? role.name,
      slug: updates.slug ?? role.slug,
      description: updates.description ?? role.description,
      permissions: updates.permissions ?? role.permissions,
      color: updates.color ?? role.color,
      icon: updates.icon ?? role.icon,
      isDefault: updates.isDefault ?? role.isDefault,
      updatedAt: new Date().toISOString(),
    }

    roles.set(id, updatedRole)

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/roles - Delete role
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    const role = roles.get(id)
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Prevent deleting system roles
    if (role.type === 'SYSTEM') {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      )
    }

    // Check if role has users assigned
    if (role.userCount && role.userCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete role with assigned users',
          userCount: role.userCount,
        },
        { status: 400 }
      )
    }

    roles.delete(id)

    return NextResponse.json({ success: true, deleted: id })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
