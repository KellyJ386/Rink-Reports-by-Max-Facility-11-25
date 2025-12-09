/**
 * Unit tests for permission utilities
 * @file __tests__/unit/permissions.test.ts
 */

import { hasPermission, hasModuleAccess, getAccessibleModules } from '@/lib/permissions'
import type { UserWithPermissions } from '@/types'

// Mock user with full permissions
const adminUser: UserWithPermissions = {
  id: 'admin-1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: {
    id: 'role-admin',
    name: 'Admin',
    permissions: {
      ice_depth: { view: true, create: true, edit: true, delete: true, export: true },
      compressor_logs: { view: true, create: true, edit: true, delete: true, export: true },
      ice_operations: { view: true, create: true, edit: true, delete: true, export: true },
      incident_reports: { view: true, create: true, edit: true, delete: true, export: true },
      scheduling: { view: true, create: true, edit: true, delete: true, export: true },
      analytics: { view: true, create: true, edit: true, delete: true, export: true },
      admin: { view: true, create: true, edit: true, delete: true, export: true },
      settings: { view: true, create: true, edit: true, delete: true, export: true },
    },
    facilityId: 'facility-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  permissionOverrides: null,
  facilityId: 'facility-1',
}

// Mock user with limited permissions
const staffUser: UserWithPermissions = {
  id: 'staff-1',
  email: 'staff@test.com',
  firstName: 'Staff',
  lastName: 'User',
  role: {
    id: 'role-staff',
    name: 'Staff',
    permissions: {
      ice_depth: { view: true, create: true, edit: false, delete: false, export: false },
      compressor_logs: { view: true, create: true, edit: false, delete: false, export: false },
      ice_operations: { view: true, create: false, edit: false, delete: false, export: false },
      incident_reports: { view: true, create: true, edit: false, delete: false, export: false },
      scheduling: { view: true, create: false, edit: false, delete: false, export: false },
      analytics: { view: false, create: false, edit: false, delete: false, export: false },
      admin: { view: false, create: false, edit: false, delete: false, export: false },
      settings: { view: false, create: false, edit: false, delete: false, export: false },
    },
    facilityId: 'facility-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  permissionOverrides: null,
  facilityId: 'facility-1',
}

// Mock user with permission overrides
const userWithOverrides: UserWithPermissions = {
  ...staffUser,
  id: 'override-1',
  permissionOverrides: {
    ice_depth: { view: true, create: true, edit: true, delete: false, export: true },
    analytics: { view: true, create: false, edit: false, delete: false, export: false },
  },
}

describe('Permission Utilities', () => {
  describe('hasPermission', () => {
    it('should return true for admin with full permissions', () => {
      expect(hasPermission(adminUser, 'ice_depth', 'view')).toBe(true)
      expect(hasPermission(adminUser, 'ice_depth', 'create')).toBe(true)
      expect(hasPermission(adminUser, 'ice_depth', 'edit')).toBe(true)
      expect(hasPermission(adminUser, 'ice_depth', 'delete')).toBe(true)
      expect(hasPermission(adminUser, 'admin', 'view')).toBe(true)
    })

    it('should return correct permissions for staff user', () => {
      expect(hasPermission(staffUser, 'ice_depth', 'view')).toBe(true)
      expect(hasPermission(staffUser, 'ice_depth', 'create')).toBe(true)
      expect(hasPermission(staffUser, 'ice_depth', 'edit')).toBe(false)
      expect(hasPermission(staffUser, 'ice_depth', 'delete')).toBe(false)
      expect(hasPermission(staffUser, 'admin', 'view')).toBe(false)
    })

    it('should apply permission overrides', () => {
      // Staff user normally cannot edit ice_depth, but override allows it
      expect(hasPermission(userWithOverrides, 'ice_depth', 'edit')).toBe(true)
      // Staff user normally cannot view analytics, but override allows it
      expect(hasPermission(userWithOverrides, 'analytics', 'view')).toBe(true)
    })

    it('should return false for unknown modules', () => {
      expect(hasPermission(adminUser, 'unknown_module' as any, 'view')).toBe(false)
    })
  })

  describe('hasModuleAccess', () => {
    it('should return true when user can view module', () => {
      expect(hasModuleAccess(adminUser, 'ice_depth')).toBe(true)
      expect(hasModuleAccess(staffUser, 'ice_depth')).toBe(true)
    })

    it('should return false when user cannot view module', () => {
      expect(hasModuleAccess(staffUser, 'admin')).toBe(false)
      expect(hasModuleAccess(staffUser, 'analytics')).toBe(false)
    })

    it('should respect permission overrides', () => {
      expect(hasModuleAccess(userWithOverrides, 'analytics')).toBe(true)
    })
  })

  describe('getAccessibleModules', () => {
    it('should return all modules for admin', () => {
      const modules = getAccessibleModules(adminUser)

      expect(modules).toContain('ice_depth')
      expect(modules).toContain('compressor_logs')
      expect(modules).toContain('admin')
      expect(modules).toContain('analytics')
      expect(modules.length).toBe(8)
    })

    it('should return limited modules for staff', () => {
      const modules = getAccessibleModules(staffUser)

      expect(modules).toContain('ice_depth')
      expect(modules).toContain('compressor_logs')
      expect(modules).not.toContain('admin')
      expect(modules).not.toContain('analytics')
    })

    it('should include overridden modules', () => {
      const modules = getAccessibleModules(userWithOverrides)

      expect(modules).toContain('analytics') // Added via override
    })
  })
})
