import { describe, it, expect } from 'vitest'
import {
  getUserPermissions,
  canUserAccess,
  requirePermission,
  getAccessibleModules,
} from '@/lib/permissions'
import type { PermissionSet, ModulePermissions } from '@/types'

// Default permission set for testing
const createDefaultPermissions = (): PermissionSet => ({
  admin: { access: false },
  iceDepth: { access: true, submit: true, viewOwn: true, viewAll: false, edit: false, delete: false },
  iceOperations: { access: true, submit: true, viewOwn: true, viewAll: false, edit: false, delete: false },
  refrigeration: { access: true, submit: true, viewOwn: true, viewAll: false, edit: false, delete: false },
  airQuality: { access: true, submit: true, viewOwn: true, viewAll: false, edit: false, delete: false },
  incidents: { access: true, submit: true, viewOwn: true, viewAll: false, edit: false, delete: false },
  schedule: { access: true, viewOwn: true, viewAll: false },
  dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: false, edit: false, delete: false },
})

const createAdminPermissions = (): PermissionSet => ({
  admin: { access: true, viewAll: true, edit: true, delete: true, createTemplates: true },
  iceDepth: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
  iceOperations: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
  refrigeration: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
  airQuality: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
  incidents: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true, approve: true },
  schedule: { access: true, viewOwn: true, viewAll: true, edit: true, create: true, publish: true },
  dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
})

// Mock user factory
const createMockUser = (
  permissions: PermissionSet,
  overrides: Partial<PermissionSet> | null = null
) => ({
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: 'hashed',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  isActive: true,
  roleId: 'role-123',
  facilityId: 'facility-123',
  permissionOverrides: overrides,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: {
    id: 'role-123',
    name: 'Test Role',
    description: 'Test role description',
    permissions: permissions,
    facilityId: 'facility-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
})

describe('Permissions Module', () => {
  describe('getUserPermissions', () => {
    it('should return base role permissions when no overrides exist', () => {
      const basePermissions = createDefaultPermissions()
      const user = createMockUser(basePermissions, null)

      const result = getUserPermissions(user)

      expect(result).toEqual(basePermissions)
    })

    it('should return base permissions when overrides is empty object', () => {
      const basePermissions = createDefaultPermissions()
      const user = createMockUser(basePermissions, {} as Partial<PermissionSet>)

      const result = getUserPermissions(user)

      expect(result).toEqual(basePermissions)
    })

    it('should merge overrides with base permissions', () => {
      const basePermissions = createDefaultPermissions()
      const overrides: Partial<PermissionSet> = {
        admin: { access: true, viewAll: true },
      }
      const user = createMockUser(basePermissions, overrides)

      const result = getUserPermissions(user)

      // Admin should now have access (overridden)
      expect(result.admin.access).toBe(true)
      expect(result.admin.viewAll).toBe(true)
      // Other modules should remain unchanged
      expect(result.iceDepth).toEqual(basePermissions.iceDepth)
    })

    it('should allow partial module overrides while preserving other permissions', () => {
      const basePermissions = createDefaultPermissions()
      const overrides: Partial<PermissionSet> = {
        iceDepth: { access: true, viewAll: true, edit: true },
      }
      const user = createMockUser(basePermissions, overrides)

      const result = getUserPermissions(user)

      // Check merged iceDepth permissions
      expect(result.iceDepth.access).toBe(true)
      expect(result.iceDepth.viewAll).toBe(true) // Overridden
      expect(result.iceDepth.edit).toBe(true) // Overridden
      expect(result.iceDepth.submit).toBe(true) // From base
      expect(result.iceDepth.viewOwn).toBe(true) // From base
    })

    it('should handle multiple module overrides', () => {
      const basePermissions = createDefaultPermissions()
      const overrides: Partial<PermissionSet> = {
        admin: { access: true },
        incidents: { access: true, approve: true },
        schedule: { access: true, edit: true, create: true },
      }
      const user = createMockUser(basePermissions, overrides)

      const result = getUserPermissions(user)

      expect(result.admin.access).toBe(true)
      expect(result.incidents.approve).toBe(true)
      expect(result.schedule.edit).toBe(true)
      expect(result.schedule.create).toBe(true)
    })
  })

  describe('canUserAccess', () => {
    it('should return true when user has permission for the action', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      const result = canUserAccess(user, 'iceDepth', 'access')

      expect(result).toBe(true)
    })

    it('should return false when user does not have permission for the action', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      const result = canUserAccess(user, 'admin', 'access')

      expect(result).toBe(false)
    })

    it('should return false when action is not defined for the module', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      const result = canUserAccess(user, 'iceDepth', 'delete')

      expect(result).toBe(false)
    })

    it('should correctly check submit permission', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      expect(canUserAccess(user, 'iceDepth', 'submit')).toBe(true)
      expect(canUserAccess(user, 'iceOperations', 'submit')).toBe(true)
    })

    it('should respect permission overrides in access check', () => {
      const basePermissions = createDefaultPermissions()
      const overrides: Partial<PermissionSet> = {
        admin: { access: true, edit: true },
      }
      const user = createMockUser(basePermissions, overrides)

      expect(canUserAccess(user, 'admin', 'access')).toBe(true)
      expect(canUserAccess(user, 'admin', 'edit')).toBe(true)
    })

    it('should return false for undefined module permissions', () => {
      const permissions = {
        admin: { access: false },
        iceDepth: { access: true },
      } as PermissionSet
      const user = createMockUser(permissions)

      // Testing with a module that exists but might have undefined nested permissions
      const result = canUserAccess(user, 'refrigeration', 'access')

      // Since refrigeration is not in permissions, should return false
      expect(result).toBe(false)
    })

    describe('admin role permissions', () => {
      const adminUser = createMockUser(createAdminPermissions())

      it('should have full admin access', () => {
        expect(canUserAccess(adminUser, 'admin', 'access')).toBe(true)
        expect(canUserAccess(adminUser, 'admin', 'viewAll')).toBe(true)
        expect(canUserAccess(adminUser, 'admin', 'edit')).toBe(true)
        expect(canUserAccess(adminUser, 'admin', 'delete')).toBe(true)
        expect(canUserAccess(adminUser, 'admin', 'createTemplates')).toBe(true)
      })

      it('should have incident approval permission', () => {
        expect(canUserAccess(adminUser, 'incidents', 'approve')).toBe(true)
      })

      it('should have schedule management permissions', () => {
        expect(canUserAccess(adminUser, 'schedule', 'create')).toBe(true)
        expect(canUserAccess(adminUser, 'schedule', 'publish')).toBe(true)
        expect(canUserAccess(adminUser, 'schedule', 'edit')).toBe(true)
      })
    })
  })

  describe('requirePermission', () => {
    it('should not throw when user has permission', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      expect(() => {
        requirePermission(user, 'iceDepth', 'access')
      }).not.toThrow()
    })

    it('should throw error when user lacks permission', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      expect(() => {
        requirePermission(user, 'admin', 'access')
      }).toThrow('Insufficient permissions: admin.access')
    })

    it('should throw with correct module and action in error message', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      expect(() => {
        requirePermission(user, 'incidents', 'approve')
      }).toThrow('Insufficient permissions: incidents.approve')
    })

    it('should throw for delete permission when not granted', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      expect(() => {
        requirePermission(user, 'iceDepth', 'delete')
      }).toThrow('Insufficient permissions: iceDepth.delete')
    })
  })

  describe('getAccessibleModules', () => {
    it('should return all modules with access: true', () => {
      const permissions = createDefaultPermissions()
      const user = createMockUser(permissions)

      const result = getAccessibleModules(user)

      // Default permissions grant access to all except admin
      expect(result).toContain('iceDepth')
      expect(result).toContain('iceOperations')
      expect(result).toContain('refrigeration')
      expect(result).toContain('airQuality')
      expect(result).toContain('incidents')
      expect(result).toContain('schedule')
      expect(result).toContain('dailyChecklist')
      expect(result).not.toContain('admin')
    })

    it('should return empty array when no modules are accessible', () => {
      const permissions: PermissionSet = {
        admin: { access: false },
        iceDepth: { access: false },
        iceOperations: { access: false },
        refrigeration: { access: false },
        airQuality: { access: false },
        incidents: { access: false },
        schedule: { access: false },
        dailyChecklist: { access: false },
      }
      const user = createMockUser(permissions)

      const result = getAccessibleModules(user)

      expect(result).toHaveLength(0)
    })

    it('should return all modules for admin user', () => {
      const user = createMockUser(createAdminPermissions())

      const result = getAccessibleModules(user)

      expect(result).toHaveLength(8)
      expect(result).toContain('admin')
      expect(result).toContain('iceDepth')
      expect(result).toContain('iceOperations')
      expect(result).toContain('refrigeration')
      expect(result).toContain('airQuality')
      expect(result).toContain('incidents')
      expect(result).toContain('schedule')
      expect(result).toContain('dailyChecklist')
    })

    it('should respect permission overrides for module access', () => {
      const basePermissions = createDefaultPermissions()
      const overrides: Partial<PermissionSet> = {
        admin: { access: true },
      }
      const user = createMockUser(basePermissions, overrides)

      const result = getAccessibleModules(user)

      expect(result).toContain('admin')
      expect(result).toHaveLength(8) // Now includes admin
    })

    it('should handle case where override removes access', () => {
      const basePermissions = createDefaultPermissions()
      const overrides: Partial<PermissionSet> = {
        iceDepth: { access: false },
        iceOperations: { access: false },
      }
      const user = createMockUser(basePermissions, overrides)

      const result = getAccessibleModules(user)

      expect(result).not.toContain('iceDepth')
      expect(result).not.toContain('iceOperations')
      expect(result).toHaveLength(5) // 7 original - 2 removed
    })
  })

  describe('Role-based permission scenarios', () => {
    describe('Operator role', () => {
      const operatorPermissions = createDefaultPermissions()
      const operator = createMockUser(operatorPermissions)

      it('should be able to submit forms', () => {
        expect(canUserAccess(operator, 'iceDepth', 'submit')).toBe(true)
        expect(canUserAccess(operator, 'iceOperations', 'submit')).toBe(true)
        expect(canUserAccess(operator, 'dailyChecklist', 'submit')).toBe(true)
      })

      it('should be able to view own submissions', () => {
        expect(canUserAccess(operator, 'iceDepth', 'viewOwn')).toBe(true)
        expect(canUserAccess(operator, 'incidents', 'viewOwn')).toBe(true)
      })

      it('should not be able to view all submissions', () => {
        expect(canUserAccess(operator, 'iceDepth', 'viewAll')).toBe(false)
        expect(canUserAccess(operator, 'incidents', 'viewAll')).toBe(false)
      })

      it('should not have admin access', () => {
        expect(canUserAccess(operator, 'admin', 'access')).toBe(false)
      })
    })

    describe('Manager role (with overrides)', () => {
      const basePermissions = createDefaultPermissions()
      const managerOverrides: Partial<PermissionSet> = {
        iceDepth: { access: true, viewAll: true, edit: true },
        iceOperations: { access: true, viewAll: true, edit: true },
        incidents: { access: true, viewAll: true, approve: true },
        schedule: { access: true, viewAll: true, edit: true, create: true },
      }
      const manager = createMockUser(basePermissions, managerOverrides)

      it('should be able to view all submissions', () => {
        expect(canUserAccess(manager, 'iceDepth', 'viewAll')).toBe(true)
        expect(canUserAccess(manager, 'iceOperations', 'viewAll')).toBe(true)
      })

      it('should be able to edit submissions', () => {
        expect(canUserAccess(manager, 'iceDepth', 'edit')).toBe(true)
      })

      it('should be able to approve incidents', () => {
        expect(canUserAccess(manager, 'incidents', 'approve')).toBe(true)
      })

      it('should be able to create schedules', () => {
        expect(canUserAccess(manager, 'schedule', 'create')).toBe(true)
      })
    })
  })
})
