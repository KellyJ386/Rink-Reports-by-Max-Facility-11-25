import { prisma } from '@/lib/prisma'
import { ModuleType } from '@prisma/client'
import { logAccessDenied } from './auditLogger'

export interface PermissionContext {
  userId: string
  facilityId: string
  roleId: string
}

export interface ModulePermissions {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  export: boolean
  approve?: boolean
}

export interface RolePermissions {
  [ModuleType.ICE_DEPTH]: ModulePermissions
  [ModuleType.ICE_OPERATIONS]: ModulePermissions
  [ModuleType.REFRIGERATION]: ModulePermissions
  [ModuleType.AIR_QUALITY]: ModulePermissions
  [ModuleType.INCIDENT]: ModulePermissions
  [ModuleType.SCHEDULE]: ModulePermissions
  [ModuleType.DAILY_CHECKLIST]: ModulePermissions
  admin?: {
    manageUsers: boolean
    manageFacilities: boolean
    manageRoles: boolean
    viewAuditLogs: boolean
    manageSettings: boolean
  }
}

export async function getUserPermissions(userId: string): Promise<RolePermissions | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  })

  if (!user || !user.role) {
    return null
  }

  let permissions = user.role.permissions as RolePermissions

  if (user.permissionOverrides) {
    permissions = {
      ...permissions,
      ...(user.permissionOverrides as Partial<RolePermissions>),
    }
  }

  return permissions
}

export async function checkPermission(
  userId: string,
  module: ModuleType | 'admin',
  action: keyof ModulePermissions | keyof NonNullable<RolePermissions['admin']>
): Promise<boolean> {
  const permissions = await getUserPermissions(userId)

  if (!permissions) {
    return false
  }

  if (module === 'admin') {
    return permissions.admin?.[action as keyof NonNullable<RolePermissions['admin']>] ?? false
  }

  const modulePermissions = permissions[module as ModuleType]
  return modulePermissions?.[action as keyof ModulePermissions] ?? false
}

export async function requirePermission(
  userId: string,
  facilityId: string,
  module: ModuleType | 'admin',
  action: keyof ModulePermissions | keyof NonNullable<RolePermissions['admin']>,
  entityType: string,
  entityId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const hasPermission = await checkPermission(userId, module, action)

  if (!hasPermission) {
    await logAccessDenied(
      userId,
      entityType,
      entityId,
      `Missing permission: ${module}.${String(action)}`,
      ipAddress,
      userAgent
    )
    return false
  }

  return true
}

export async function checkFacilityAccess(userId: string, facilityId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      facilityId: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    return false
  }

  return user.facilityId === facilityId
}

export async function checkRinkAccess(userId: string, rinkId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      facilityId: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    return false
  }

  const rink = await prisma.rink.findUnique({
    where: { id: rinkId },
    select: {
      facilityId: true,
    },
  })

  if (!rink) {
    return false
  }

  return user.facilityId === rink.facilityId
}

export async function checkSubmissionAccess(
  userId: string,
  submissionId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      facilityId: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) {
    return false
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      rink: {
        select: {
          facilityId: true,
        },
      },
    },
  })

  if (!submission) {
    return false
  }

  return user.facilityId === submission.rink.facilityId
}

export async function checkUserAccess(
  requestingUserId: string,
  targetUserId: string
): Promise<boolean> {
  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId },
    select: {
      facilityId: true,
      isActive: true,
    },
  })

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      facilityId: true,
    },
  })

  if (!requestingUser || !requestingUser.isActive || !targetUser) {
    return false
  }

  return requestingUser.facilityId === targetUser.facilityId
}

export function getClientInfo(request: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined

  const userAgent = request.headers.get('user-agent') || undefined

  return { ipAddress, userAgent }
}

export class PermissionError extends Error {
  constructor(
    message: string,
    public module: string,
    public action: string,
    public userId?: string
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

export class FacilityAccessError extends Error {
  constructor(
    message: string,
    public facilityId: string,
    public userId?: string
  ) {
    super(message)
    this.name = 'FacilityAccessError'
  }
}
