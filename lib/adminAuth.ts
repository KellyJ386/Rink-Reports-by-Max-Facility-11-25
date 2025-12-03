import { getSession } from './auth'
import { getUserPermissions } from './permissions'
import type { UserWithRole, PermissionSet } from '@/types'
import { prisma } from './prisma'

export type AdminPermission = 'access' | 'editUsers' | 'editForms' | 'editSettings'

export interface AdminPermissions {
  access: boolean
  editUsers?: boolean
  editForms?: boolean
  editSettings?: boolean
}

/**
 * Get admin-specific permissions for a user
 */
export function getAdminPermissions(user: UserWithRole): AdminPermissions {
  const permissions = getUserPermissions(user)
  return permissions.admin as AdminPermissions
}

/**
 * Check if user has a specific admin permission
 */
export function hasAdminPermission(
  user: UserWithRole,
  permission: AdminPermission
): boolean {
  const adminPerms = getAdminPermissions(user)

  if (!adminPerms.access) {
    return false
  }

  if (permission === 'access') {
    return true
  }

  return adminPerms[permission] === true
}

/**
 * Require admin access - throws if user doesn't have admin access
 */
export async function requireAdminAccess(): Promise<UserWithRole> {
  const user = await getSession()

  if (!user) {
    throw new Error('Unauthorized: Not logged in')
  }

  if (!hasAdminPermission(user, 'access')) {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}

/**
 * Require specific admin permission - throws if user doesn't have it
 */
export async function requireAdminPermission(
  permission: AdminPermission
): Promise<UserWithRole> {
  const user = await getSession()

  if (!user) {
    throw new Error('Unauthorized: Not logged in')
  }

  if (!hasAdminPermission(user, permission)) {
    throw new Error(`Forbidden: ${permission} permission required`)
  }

  return user
}

/**
 * Create an audit log entry for admin actions
 */
export async function logAdminAction(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE',
  entityType: string,
  entityId: string,
  previousValue?: unknown,
  newValue?: unknown,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      ipAddress,
      userAgent,
    },
  })
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(headers: Headers): string {
  return headers.get('user-agent') || 'unknown'
}
