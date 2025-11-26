import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogStats } from '@/lib/security/auditLogger'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logAccessDenied } from '@/lib/security/auditLogger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    const facilityId = searchParams.get('facilityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!facilityId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'facilityId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const hasPermission = await checkPermission(userId, 'admin', 'viewAuditLogs')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'AuditLogStats',
        facilityId,
        'Missing admin.viewAuditLogs permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await getAuditLogStats(
      facilityId,
      new Date(startDate),
      new Date(endDate)
    )

    return NextResponse.json({ stats }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching audit log stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
