import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, getAuditLogStats } from '@/lib/security/auditLogger'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logAccessDenied } from '@/lib/security/auditLogger'
import { AuditAction } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    const facilityId = searchParams.get('facilityId')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!facilityId) {
      return NextResponse.json({ error: 'facilityId is required' }, { status: 400 })
    }

    const hasPermission = await checkPermission(userId, 'admin', 'viewAuditLogs')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'AuditLog',
        facilityId,
        'Missing admin.viewAuditLogs permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUserId = searchParams.get('userId') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const action = (searchParams.get('action') as AuditAction) || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 100
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!)
      : 0

    const { logs, total } = await getAuditLogs({
      facilityId,
      userId: targetUserId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit,
      offset,
    })

    return NextResponse.json(
      {
        logs,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
