import type { User, Role, ModuleType, ModulePermissions, PermissionSet } from '@/types'

export function getUserPermissions(
  user: User & { role: Role }
): PermissionSet {
  const basePermissions = user.role.permissions as PermissionSet
  const overrides = user.permissionOverrides as Partial<PermissionSet> | null

  if (!overrides) {
    return basePermissions
  }

  // Merge overrides with base permissions
  const merged: PermissionSet = { ...basePermissions }

  for (const moduleKey in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, moduleKey)) {
      merged[moduleKey as ModuleType] = {
        ...basePermissions[moduleKey as ModuleType],
        ...overrides[moduleKey as ModuleType],
      }
    }
  }

  return merged
}

export function canUserAccess(
  user: User & { role: Role },
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
  user: User & { role: Role },
  module: ModuleType,
  action: keyof ModulePermissions
): void {
  if (!canUserAccess(user, module, action)) {
    throw new Error(`Insufficient permissions: ${module}.${action}`)
  }
}

export function getAccessibleModules(
  user: User & { role: Role }
): ModuleType[] {
  const permissions = getUserPermissions(user)
  const modules: ModuleType[] = []

  for (const moduleKey in permissions) {
    if (permissions[moduleKey as ModuleType].access) {
      modules.push(moduleKey as ModuleType)
    }
  }

  return modules
}
