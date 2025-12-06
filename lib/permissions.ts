import type { ModuleType, ModulePermissions, PermissionSet } from '@/types'

// User type for permissions (compatible with Prisma User)
interface UserWithRole {
  id: string
  permissionOverrides?: unknown
  role: {
    permissions: unknown
  }
}

export function getUserPermissions(
  user: UserWithRole
): PermissionSet {
  const basePermissions = user.role.permissions as PermissionSet
  const overrides = user.permissionOverrides as Partial<PermissionSet> | null

  if (!overrides) {
    return basePermissions
  }

  // Merge overrides with base permissions
  const merged: PermissionSet = { ...basePermissions }

  for (const module in overrides) {
    if (overrides.hasOwnProperty(module)) {
      merged[module as ModuleType] = {
        ...basePermissions[module as ModuleType],
        ...overrides[module as ModuleType],
      }
    }
  }

  return merged
}

export function canUserAccess(
  user: UserWithRole,
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

export function requirePermission(
  user: UserWithRole,
  module: ModuleType,
  action: keyof ModulePermissions
): void {
  if (!canUserAccess(user, module, action)) {
    throw new Error(`Insufficient permissions: ${module}.${action}`)
  }
}

export function getAccessibleModules(
  user: UserWithRole
): ModuleType[] {
  const permissions = getUserPermissions(user)
  const modules: ModuleType[] = []

  for (const module in permissions) {
    if (permissions[module as ModuleType].access) {
      modules.push(module as ModuleType)
    }
  }

  return modules
}
