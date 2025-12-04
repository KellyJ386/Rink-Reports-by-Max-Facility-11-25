import { describe, it, expect } from 'vitest'

// Types matching the application
interface ModulePermissions {
  access: boolean
  submit?: boolean
  viewOwn?: boolean
  viewAll?: boolean
  edit?: boolean
  delete?: boolean
  export?: boolean
  approve?: boolean
  createTemplates?: boolean
  create?: boolean
  publish?: boolean
}

interface PermissionSet {
  admin: ModulePermissions
  iceDepth: ModulePermissions
  iceOperations: ModulePermissions
  refrigeration: ModulePermissions
  airQuality: ModulePermissions
  incidents: ModulePermissions
  schedule: ModulePermissions
  dailyChecklist: ModulePermissions
}

type ModuleType = keyof PermissionSet

interface Role {
  id: string
  name: string
  permissions: PermissionSet
}

interface User {
  id: string
  email: string
  roleId: string
  permissionOverrides: Partial<PermissionSet> | null
  role: Role
}

// Pure function implementations matching lib/permissions.ts
function getUserPermissions(user: User): PermissionSet {
  const basePermissions = user.role.permissions
  const overrides = user.permissionOverrides

  if (!overrides) {
    return basePermissions
  }

  const merged: PermissionSet = { ...basePermissions }

  for (const module in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, module)) {
      merged[module as ModuleType] = {
        ...basePermissions[module as ModuleType],
        ...overrides[module as ModuleType],
      }
    }
  }

  return merged
}

function canUserAccess(
  user: User,
  module: ModuleType,
  action: keyof ModulePermissions
): boolean {
  const permissions = getUserPermissions(user)
  const modulePermissions = permissions[module]

  if (!modulePermissions) {
    return false
  }

  return modulePermissions[action] === true
}

function requirePermission(
  user: User,
  module: ModuleType,
  action: keyof ModulePermissions
): void {
  if (!canUserAccess(user, module, action)) {
    throw new Error(`Insufficient permissions: ${module}.${action}`)
  }
}

function getAccessibleModules(user: User): ModuleType[] {
  const permissions = getUserPermissions(user)
  const modules: ModuleType[] = []

  for (const module in permissions) {
    if (permissions[module as ModuleType].access) {
      modules.push(module as ModuleType)
    }
  }

  return modules
}

// Test fixtures
function createOperatorRole(): Role {
  return {
    id: 'role-operator',
    name: 'Operator',
    permissions: {
      admin: { access: false },
      iceDepth: { access: true, submit: true, viewOwn: true, viewAll: false },
      iceOperations: { access: true, submit: true, viewOwn: true, viewAll: false },
      refrigeration: { access: true, submit: true, viewOwn: true, viewAll: false },
      airQuality: { access: true, submit: true, viewOwn: true, viewAll: false },
      incidents: { access: true, submit: true, viewOwn: true, viewAll: false },
      schedule: { access: true, viewOwn: true, viewAll: false },
      dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: false },
    },
  }
}

function createManagerRole(): Role {
  return {
    id: 'role-manager',
    name: 'Facility Manager',
    permissions: {
      admin: { access: true, createTemplates: true },
      iceDepth: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, approve: true, export: true },
      iceOperations: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, approve: true, export: true },
      refrigeration: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, approve: true, export: true },
      airQuality: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, approve: true, export: true },
      incidents: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, approve: true, export: true },
      schedule: { access: true, viewOwn: true, viewAll: true, create: true, edit: true, publish: true },
      dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, export: true },
    },
  }
}

function createOperatorUser(overrides?: Partial<PermissionSet>): User {
  return {
    id: 'user-operator',
    email: 'operator@example.com',
    roleId: 'role-operator',
    role: createOperatorRole(),
    permissionOverrides: overrides || null,
  }
}

function createManagerUser(overrides?: Partial<PermissionSet>): User {
  return {
    id: 'user-manager',
    email: 'manager@example.com',
    roleId: 'role-manager',
    role: createManagerRole(),
    permissionOverrides: overrides || null,
  }
}

describe('getUserPermissions', () => {
  it('should return base role permissions when no overrides', () => {
    const user = createOperatorUser()
    const permissions = getUserPermissions(user)

    expect(permissions).toEqual(user.role.permissions)
  })

  it('should merge overrides with base permissions', () => {
    const user = createOperatorUser({
      iceDepth: { access: true, viewAll: true }, // Grant viewAll that operator normally doesn't have
    })

    const permissions = getUserPermissions(user)

    expect(permissions.iceDepth.viewAll).toBe(true)
    expect(permissions.iceDepth.submit).toBe(true) // Still has original permission
    expect(permissions.iceDepth.viewOwn).toBe(true) // Still has original permission
  })

  it('should allow overrides to revoke permissions', () => {
    const user = createManagerUser({
      incidents: { access: true, approve: false }, // Revoke approve permission
    })

    const permissions = getUserPermissions(user)

    expect(permissions.incidents.approve).toBe(false)
    expect(permissions.incidents.viewAll).toBe(true) // Other permissions unchanged
  })

  it('should only override specified modules', () => {
    const user = createOperatorUser({
      iceDepth: { access: true, viewAll: true },
    })

    const permissions = getUserPermissions(user)

    // iceDepth is modified
    expect(permissions.iceDepth.viewAll).toBe(true)

    // Other modules unchanged
    expect(permissions.iceOperations.viewAll).toBe(false)
    expect(permissions.refrigeration.viewAll).toBe(false)
  })

  it('should handle empty overrides object', () => {
    const user: User = {
      ...createOperatorUser(),
      permissionOverrides: {},
    }

    const permissions = getUserPermissions(user)

    expect(permissions).toEqual(user.role.permissions)
  })
})

describe('canUserAccess', () => {
  describe('Operator permissions', () => {
    const operator = createOperatorUser()

    it('should allow access to ice depth module', () => {
      expect(canUserAccess(operator, 'iceDepth', 'access')).toBe(true)
    })

    it('should allow submit to ice depth', () => {
      expect(canUserAccess(operator, 'iceDepth', 'submit')).toBe(true)
    })

    it('should allow viewOwn for operator', () => {
      expect(canUserAccess(operator, 'iceDepth', 'viewOwn')).toBe(true)
    })

    it('should deny viewAll for operator', () => {
      expect(canUserAccess(operator, 'iceDepth', 'viewAll')).toBe(false)
    })

    it('should deny admin access for operator', () => {
      expect(canUserAccess(operator, 'admin', 'access')).toBe(false)
    })

    it('should deny export for operator', () => {
      expect(canUserAccess(operator, 'iceDepth', 'export')).toBe(false)
    })

    it('should deny approve for operator', () => {
      expect(canUserAccess(operator, 'incidents', 'approve')).toBe(false)
    })
  })

  describe('Manager permissions', () => {
    const manager = createManagerUser()

    it('should allow admin access for manager', () => {
      expect(canUserAccess(manager, 'admin', 'access')).toBe(true)
    })

    it('should allow viewAll for manager', () => {
      expect(canUserAccess(manager, 'iceDepth', 'viewAll')).toBe(true)
    })

    it('should allow approve for manager', () => {
      expect(canUserAccess(manager, 'incidents', 'approve')).toBe(true)
    })

    it('should allow export for manager', () => {
      expect(canUserAccess(manager, 'iceDepth', 'export')).toBe(true)
    })

    it('should allow schedule publish for manager', () => {
      expect(canUserAccess(manager, 'schedule', 'publish')).toBe(true)
    })

    it('should allow createTemplates for manager', () => {
      expect(canUserAccess(manager, 'admin', 'createTemplates')).toBe(true)
    })
  })

  describe('Permission overrides', () => {
    it('should grant permissions via override', () => {
      const user = createOperatorUser({
        iceDepth: { access: true, viewAll: true },
      })

      expect(canUserAccess(user, 'iceDepth', 'viewAll')).toBe(true)
    })

    it('should revoke permissions via override', () => {
      const user = createManagerUser({
        incidents: { access: true, approve: false },
      })

      expect(canUserAccess(user, 'incidents', 'approve')).toBe(false)
    })

    it('should allow granting admin access via override', () => {
      const user = createOperatorUser({
        admin: { access: true },
      })

      expect(canUserAccess(user, 'admin', 'access')).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should return false for undefined permission', () => {
      const user = createOperatorUser()
      // schedule doesn't have submit permission defined for operator
      expect(canUserAccess(user, 'schedule', 'submit')).toBe(false)
    })

    it('should handle all module types', () => {
      const manager = createManagerUser()
      const modules: ModuleType[] = [
        'admin',
        'iceDepth',
        'iceOperations',
        'refrigeration',
        'airQuality',
        'incidents',
        'schedule',
        'dailyChecklist',
      ]

      modules.forEach((module) => {
        expect(canUserAccess(manager, module, 'access')).toBe(true)
      })
    })
  })
})

describe('requirePermission', () => {
  it('should not throw when user has permission', () => {
    const operator = createOperatorUser()

    expect(() => {
      requirePermission(operator, 'iceDepth', 'access')
    }).not.toThrow()
  })

  it('should throw when user lacks permission', () => {
    const operator = createOperatorUser()

    expect(() => {
      requirePermission(operator, 'admin', 'access')
    }).toThrow('Insufficient permissions: admin.access')
  })

  it('should include module and action in error message', () => {
    const operator = createOperatorUser()

    expect(() => {
      requirePermission(operator, 'incidents', 'approve')
    }).toThrow('Insufficient permissions: incidents.approve')
  })

  it('should work with permission overrides', () => {
    const user = createOperatorUser({
      admin: { access: true },
    })

    expect(() => {
      requirePermission(user, 'admin', 'access')
    }).not.toThrow()
  })
})

describe('getAccessibleModules', () => {
  it('should return all accessible modules for operator', () => {
    const operator = createOperatorUser()
    const modules = getAccessibleModules(operator)

    expect(modules).toContain('iceDepth')
    expect(modules).toContain('iceOperations')
    expect(modules).toContain('refrigeration')
    expect(modules).toContain('airQuality')
    expect(modules).toContain('incidents')
    expect(modules).toContain('schedule')
    expect(modules).toContain('dailyChecklist')
    expect(modules).not.toContain('admin')
  })

  it('should return all modules for manager including admin', () => {
    const manager = createManagerUser()
    const modules = getAccessibleModules(manager)

    expect(modules).toContain('admin')
    expect(modules).toContain('iceDepth')
    expect(modules).toContain('iceOperations')
    expect(modules).toContain('refrigeration')
    expect(modules).toContain('airQuality')
    expect(modules).toContain('incidents')
    expect(modules).toContain('schedule')
    expect(modules).toContain('dailyChecklist')
    expect(modules).toHaveLength(8)
  })

  it('should respect permission overrides for module access', () => {
    const user = createOperatorUser({
      admin: { access: true },
    })
    const modules = getAccessibleModules(user)

    expect(modules).toContain('admin')
  })

  it('should exclude modules revoked via override', () => {
    const user = createManagerUser({
      iceDepth: { access: false },
    })
    const modules = getAccessibleModules(user)

    expect(modules).not.toContain('iceDepth')
  })

  it('should return empty array for user with no access', () => {
    const restrictedRole: Role = {
      id: 'role-restricted',
      name: 'Restricted',
      permissions: {
        admin: { access: false },
        iceDepth: { access: false },
        iceOperations: { access: false },
        refrigeration: { access: false },
        airQuality: { access: false },
        incidents: { access: false },
        schedule: { access: false },
        dailyChecklist: { access: false },
      },
    }

    const user: User = {
      id: 'user-restricted',
      email: 'restricted@example.com',
      roleId: 'role-restricted',
      role: restrictedRole,
      permissionOverrides: null,
    }

    const modules = getAccessibleModules(user)
    expect(modules).toHaveLength(0)
  })
})

describe('Role-Based Access Control Scenarios', () => {
  it('should enforce operator cannot approve incident reports', () => {
    const operator = createOperatorUser()

    // Operator can submit incidents
    expect(canUserAccess(operator, 'incidents', 'submit')).toBe(true)

    // But cannot approve them
    expect(canUserAccess(operator, 'incidents', 'approve')).toBe(false)
  })

  it('should enforce manager can publish schedules', () => {
    const manager = createManagerUser()

    expect(canUserAccess(manager, 'schedule', 'publish')).toBe(true)
  })

  it('should enforce operator cannot publish schedules', () => {
    const operator = createOperatorUser()

    expect(canUserAccess(operator, 'schedule', 'publish')).toBe(false)
  })

  it('should allow supervisor with override to approve specific module', () => {
    // Supervisor is like operator but with specific approval rights
    const supervisor = createOperatorUser({
      iceDepth: { access: true, submit: true, viewOwn: true, viewAll: true, approve: true },
    })

    expect(canUserAccess(supervisor, 'iceDepth', 'approve')).toBe(true)
    expect(canUserAccess(supervisor, 'iceDepth', 'viewAll')).toBe(true)

    // But still no admin access
    expect(canUserAccess(supervisor, 'admin', 'access')).toBe(false)
  })

  it('should support read-only user role', () => {
    const readOnlyRole: Role = {
      id: 'role-readonly',
      name: 'Read Only',
      permissions: {
        admin: { access: false },
        iceDepth: { access: true, viewOwn: true, viewAll: true },
        iceOperations: { access: true, viewOwn: true, viewAll: true },
        refrigeration: { access: true, viewOwn: true, viewAll: true },
        airQuality: { access: true, viewOwn: true, viewAll: true },
        incidents: { access: true, viewOwn: true, viewAll: true },
        schedule: { access: true, viewOwn: true, viewAll: true },
        dailyChecklist: { access: true, viewOwn: true, viewAll: true },
      },
    }

    const readOnlyUser: User = {
      id: 'user-readonly',
      email: 'readonly@example.com',
      roleId: 'role-readonly',
      role: readOnlyRole,
      permissionOverrides: null,
    }

    // Can view all
    expect(canUserAccess(readOnlyUser, 'iceDepth', 'viewAll')).toBe(true)

    // Cannot submit
    expect(canUserAccess(readOnlyUser, 'iceDepth', 'submit')).toBe(false)

    // Cannot edit
    expect(canUserAccess(readOnlyUser, 'iceDepth', 'edit')).toBe(false)
  })
})
