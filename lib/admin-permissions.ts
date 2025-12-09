// Admin Permission Service
// Comprehensive permission checking and management for admin system

import {
  User,
  UserWithDetails,
  Role,
  Permission,
  PermissionKey,
  ResourceType,
  ActionType,
  PermissionOverride,
  PermissionCategory,
  PERMISSIONS,
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions,
} from '@/types/admin'

// Re-export helper functions
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions,
}

// ============================================
// PERMISSION SERVICE CLASS
// ============================================

export class PermissionService {
  /**
   * Check if user can perform action on resource
   */
  static can(
    user: User | UserWithDetails | null,
    resource: ResourceType,
    action: ActionType,
    role?: Role
  ): boolean {
    if (!user) return false

    const permission: PermissionKey = `${resource}:${action}`
    return hasPermission(user, permission, role)
  }

  /**
   * Check multiple permissions at once
   */
  static canAny(
    user: User | UserWithDetails | null,
    checks: Array<{ resource: ResourceType; action: ActionType }>
  ): boolean {
    if (!user) return false

    return checks.some(({ resource, action }) =>
      hasPermission(user, `${resource}:${action}`)
    )
  }

  /**
   * Check if user has all specified permissions
   */
  static canAll(
    user: User | UserWithDetails | null,
    checks: Array<{ resource: ResourceType; action: ActionType }>
  ): boolean {
    if (!user) return false

    return checks.every(({ resource, action }) =>
      hasPermission(user, `${resource}:${action}`)
    )
  }

  /**
   * Get all permissions for a category
   */
  static getPermissionsByCategory(category: PermissionCategory): Permission[] {
    return PERMISSIONS[category] || []
  }

  /**
   * Get all permission categories
   */
  static getCategories(): PermissionCategory[] {
    return Object.keys(PERMISSIONS) as PermissionCategory[]
  }

  /**
   * Get permission details by key
   */
  static getPermission(key: PermissionKey): Permission | undefined {
    const [resource, action] = key.split(':') as [ResourceType, ActionType]
    return ALL_PERMISSIONS.find(
      (p) => p.resource === resource && p.action === action
    )
  }

  /**
   * Validate permission keys
   */
  static validatePermissions(permissions: string[]): {
    valid: PermissionKey[]
    invalid: string[]
  } {
    const valid: PermissionKey[] = []
    const invalid: string[] = []

    permissions.forEach((p) => {
      if (this.isValidPermissionKey(p)) {
        valid.push(p as PermissionKey)
      } else {
        invalid.push(p)
      }
    })

    return { valid, invalid }
  }

  /**
   * Check if a string is a valid permission key
   */
  static isValidPermissionKey(key: string): key is PermissionKey {
    const [resource, action] = key.split(':')
    return ALL_PERMISSIONS.some(
      (p) => p.resource === resource && p.action === action
    )
  }

  /**
   * Compare two sets of permissions and return differences
   */
  static diffPermissions(
    oldPermissions: PermissionKey[],
    newPermissions: PermissionKey[]
  ): {
    added: PermissionKey[]
    removed: PermissionKey[]
    unchanged: PermissionKey[]
  } {
    const oldSet = new Set(oldPermissions)
    const newSet = new Set(newPermissions)

    const added = newPermissions.filter((p) => !oldSet.has(p))
    const removed = oldPermissions.filter((p) => !newSet.has(p))
    const unchanged = oldPermissions.filter((p) => newSet.has(p))

    return { added, removed, unchanged }
  }

  /**
   * Get system roles
   */
  static getSystemRoles(): typeof SYSTEM_ROLES {
    return SYSTEM_ROLES
  }

  /**
   * Check if user is super admin
   */
  static isSuperAdmin(user: User | UserWithDetails | null, role?: Role): boolean {
    if (!user) return false

    const userRole = 'role' in user && user.role ? user.role : role
    return userRole?.slug === 'super-admin'
  }

  /**
   * Check if user is facility manager or higher
   */
  static isManager(user: User | UserWithDetails | null, role?: Role): boolean {
    if (!user) return false

    const userRole = 'role' in user && user.role ? user.role : role
    return ['super-admin', 'facility-manager'].includes(userRole?.slug || '')
  }

  /**
   * Check if user can manage another user
   */
  static canManageUser(
    manager: User | UserWithDetails | null,
    targetUser: User,
    managerRole?: Role,
    targetRole?: Role
  ): boolean {
    if (!manager) return false

    // Super admins can manage anyone
    if (this.isSuperAdmin(manager, managerRole)) {
      return true
    }

    // Can't manage super admins unless you are one
    const targetUserRole = 'role' in targetUser && (targetUser as UserWithDetails).role
      ? (targetUser as UserWithDetails).role
      : targetRole

    if (targetUserRole?.slug === 'super-admin') {
      return false
    }

    // Must have user management permission
    return this.can(manager, 'USERS', 'MANAGE', managerRole)
  }

  /**
   * Get permissions required for a page/feature
   */
  static getRequiredPermissions(feature: string): PermissionKey[] {
    const featurePermissions: Record<string, PermissionKey[]> = {
      'admin-users': ['USERS:VIEW'],
      'admin-users-create': ['USERS:CREATE'],
      'admin-users-edit': ['USERS:EDIT'],
      'admin-roles': ['ROLES:VIEW'],
      'admin-roles-create': ['ROLES:CREATE'],
      'admin-roles-edit': ['ROLES:EDIT'],
      'admin-settings': ['SETTINGS:VIEW'],
      'admin-settings-edit': ['SETTINGS:EDIT'],
      'admin-audit': ['AUDIT_LOGS:VIEW'],
      'schedule-manage': ['SCHEDULES:CREATE', 'SCHEDULES:EDIT'],
      'schedule-publish': ['SCHEDULES:PUBLISH'],
      'incidents-approve': ['INCIDENTS:APPROVE'],
      'reports-export': ['REPORTS:EXPORT'],
    }

    return featurePermissions[feature] || []
  }
}

// ============================================
// PERMISSION CONTEXT HELPERS
// ============================================

/**
 * Create a permission context for a user
 * Useful for serializing permission state for client-side checks
 */
export function createPermissionContext(
  user: User,
  role: Role
): {
  userId: string
  roleId: string
  roleSlug: string
  permissions: PermissionKey[]
  isSuperAdmin: boolean
  isManager: boolean
} {
  return {
    userId: user.id,
    roleId: role.id,
    roleSlug: role.slug,
    permissions: getEffectivePermissions(user, role),
    isSuperAdmin: role.slug === 'super-admin',
    isManager: ['super-admin', 'facility-manager'].includes(role.slug),
  }
}

/**
 * Permission guard for API routes
 */
export function requireAdminPermission(
  user: User | null,
  role: Role | null,
  ...permissions: PermissionKey[]
): { authorized: boolean; missing: PermissionKey[] } {
  if (!user || !role) {
    return { authorized: false, missing: permissions }
  }

  const missing: PermissionKey[] = []

  for (const permission of permissions) {
    if (!hasPermission(user, permission, role)) {
      missing.push(permission)
    }
  }

  return {
    authorized: missing.length === 0,
    missing,
  }
}

/**
 * Build a permission error message
 */
export function buildPermissionError(missing: PermissionKey[]): string {
  if (missing.length === 0) {
    return 'Permission denied'
  }

  if (missing.length === 1) {
    const perm = PermissionService.getPermission(missing[0])
    return `Permission required: ${perm?.description || missing[0]}`
  }

  return `Missing permissions: ${missing.join(', ')}`
}

// ============================================
// PERMISSION OVERRIDE HELPERS
// ============================================

/**
 * Create a permission override
 */
export function createPermissionOverride(
  permission: PermissionKey,
  granted: boolean,
  grantedBy: string,
  options?: {
    reason?: string
    expiresAt?: string
  }
): PermissionOverride {
  return {
    permission,
    granted,
    grantedBy,
    grantedAt: new Date().toISOString(),
    reason: options?.reason,
    expiresAt: options?.expiresAt,
  }
}

/**
 * Check if override is still valid (not expired)
 */
export function isOverrideValid(override: PermissionOverride): boolean {
  if (!override.expiresAt) return true
  return new Date(override.expiresAt) > new Date()
}

/**
 * Clean expired overrides from a list
 */
export function cleanExpiredOverrides(
  overrides: PermissionOverride[]
): PermissionOverride[] {
  return overrides.filter(isOverrideValid)
}

// ============================================
// ROLE HIERARCHY
// ============================================

// Role hierarchy levels (higher number = more privileges)
const ROLE_HIERARCHY: Record<string, number> = {
  'super-admin': 100,
  'facility-manager': 80,
  'supervisor': 60,
  'ice-technician': 40,
  'front-desk': 30,
  'viewer': 10,
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(roleSlug: string): number {
  return ROLE_HIERARCHY[roleSlug] || 0
}

/**
 * Check if role A outranks role B
 */
export function outranks(roleA: string, roleB: string): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB)
}

/**
 * Get roles that a user can assign (roles at or below their level)
 */
export function getAssignableRoles(userRoleSlug: string): string[] {
  const userLevel = getRoleLevel(userRoleSlug)
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level <= userLevel)
    .map(([slug]) => slug)
}
