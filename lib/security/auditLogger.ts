import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

interface AuditLogParams {
  userId?: string
  facilityId?: string
  action: AuditAction
  entityType: string
  entityId: string
  previousValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  success?: boolean
  errorMessage?: string
  submissionId?: string
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: params.userId,
        facilityId: params.facilityId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousValue: params.previousValue || null,
        newValue: params.newValue || null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || null,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
        submissionId: params.submissionId,
      },
    })

    return auditLog
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error)
    throw error
  }
}

export async function logCreate(params: Omit<AuditLogParams, 'action'>) {
  return createAuditLog({
    ...params,
    action: 'CREATE',
  })
}

export async function logUpdate(params: Omit<AuditLogParams, 'action'>) {
  return createAuditLog({
    ...params,
    action: 'UPDATE',
  })
}

export async function logDelete(params: Omit<AuditLogParams, 'action'>) {
  return createAuditLog({
    ...params,
    action: 'DELETE',
  })
}

export async function logAccess(
  userId: string,
  entityType: string,
  entityId: string,
  facilityId?: string,
  metadata?: Record<string, any>
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'CREATE', // Using CREATE as generic access log
    entityType: `${entityType}Access`,
    entityId,
    metadata,
  })
}

export async function logAccessDenied(
  userId: string | undefined,
  entityType: string,
  entityId: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    action: 'ACCESS_DENIED',
    entityType,
    entityId,
    ipAddress,
    userAgent,
    metadata: { reason },
    success: false,
  })
}

export async function logLogin(
  userId: string,
  facilityId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: success ? 'LOGIN' : 'LOGIN_FAILED',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
    success,
    errorMessage,
  })
}

export async function logLogout(
  userId: string,
  facilityId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'LOGOUT',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  })
}

export async function logPasswordChange(
  userId: string,
  facilityId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'PASSWORD_CHANGE',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
    success,
    errorMessage,
  })
}

export async function logPasswordReset(
  userId: string,
  facilityId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent,
  })
}

export async function logPermissionChange(
  userId: string,
  targetUserId: string,
  facilityId: string,
  previousValue: any,
  newValue: any,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'PERMISSION_CHANGE',
    entityType: 'User',
    entityId: targetUserId,
    previousValue,
    newValue,
    ipAddress,
    userAgent,
  })
}

export async function logDataExport(
  userId: string,
  facilityId: string,
  entityType: string,
  exportFormat: string,
  recordCount: number,
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'EXPORT',
    entityType,
    entityId: `${entityType}Export`,
    metadata: {
      format: exportFormat,
      recordCount,
      timestamp: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
  })
}

export async function logDataImport(
  userId: string,
  facilityId: string,
  entityType: string,
  recordCount: number,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'IMPORT',
    entityType,
    entityId: `${entityType}Import`,
    metadata: {
      recordCount,
      timestamp: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
    success,
    errorMessage,
  })
}

export async function logShare(
  userId: string,
  facilityId: string,
  entityType: string,
  entityId: string,
  sharedWith: string[],
  ipAddress?: string,
  userAgent?: string
) {
  return createAuditLog({
    userId,
    facilityId,
    action: 'SHARE',
    entityType,
    entityId,
    metadata: {
      sharedWith,
      timestamp: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
  })
}

export async function getAuditLogs(params: {
  facilityId?: string
  userId?: string
  entityType?: string
  entityId?: string
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (params.facilityId) where.facilityId = params.facilityId
  if (params.userId) where.userId = params.userId
  if (params.entityType) where.entityType = params.entityType
  if (params.entityId) where.entityId = params.entityId
  if (params.action) where.action = params.action

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit || 100,
      skip: params.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}

export async function getAuditLogStats(facilityId: string, startDate: Date, endDate: Date) {
  const logs = await prisma.auditLog.findMany({
    where: {
      facilityId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      action: true,
      entityType: true,
      success: true,
    },
  })

  const stats = {
    totalActions: logs.length,
    successfulActions: logs.filter((log) => log.success).length,
    failedActions: logs.filter((log) => !log.success).length,
    byAction: {} as Record<string, number>,
    byEntityType: {} as Record<string, number>,
  }

  logs.forEach((log) => {
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
    stats.byEntityType[log.entityType] = (stats.byEntityType[log.entityType] || 0) + 1
  })

  return stats
}
