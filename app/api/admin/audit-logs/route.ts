import { NextRequest, NextResponse } from 'next/server'
import { AuditLog, AuditAction, AuditSeverity } from '@/types/admin'

// In-memory storage for demo
const auditLogs = new Map<string, AuditLog>()

// Generate mock audit logs
const generateMockLogs = () => {
  if (auditLogs.size === 0) {
    const actions: AuditAction[] = [
      'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT',
      'EXPORT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK',
    ]
    const resources = ['user', 'role', 'schedule', 'incident', 'report', 'settings', 'session']
    const users = [
      { id: 'user-1', name: 'System Admin' },
      { id: 'user-2', name: 'Jane Manager' },
      { id: 'user-3', name: 'John Technician' },
      { id: 'system', name: 'System' },
    ]
    const severities: AuditSeverity[] = ['INFO', 'INFO', 'INFO', 'WARNING', 'ERROR']
    const statuses: ('SUCCESS' | 'FAILURE')[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILURE']

    const now = new Date()

    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const resource = resources[Math.floor(Math.random() * resources.length)]
      const severity = severities[Math.floor(Math.random() * severities.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)

      const log: AuditLog = {
        id: `log-${i + 1}`,
        timestamp: timestamp.toISOString(),
        userId: user.id,
        userName: user.name,
        action,
        resource,
        resourceId: `${resource}-${Math.floor(Math.random() * 1000)}`,
        details: {
          description: `${user.name} ${action.toLowerCase()}d ${resource}`,
        },
        changes: action === 'UPDATE' ? {
          before: { status: 'pending' },
          after: { status: 'active' },
        } : undefined,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        severity,
        status,
        facilityId: 'facility-1',
      }

      auditLogs.set(log.id, log)
    }
  }
}

generateMockLogs()

// GET /api/admin/audit-logs - List audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Filters
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') as AuditAction | null
    const resource = searchParams.get('resource')
    const severity = searchParams.get('severity') as AuditSeverity | null
    const status = searchParams.get('status') as 'SUCCESS' | 'FAILURE' | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')?.toLowerCase()

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let logsList = Array.from(auditLogs.values())

    // Apply filters
    if (userId) {
      logsList = logsList.filter((l) => l.userId === userId)
    }
    if (action) {
      logsList = logsList.filter((l) => l.action === action)
    }
    if (resource) {
      logsList = logsList.filter((l) => l.resource === resource)
    }
    if (severity) {
      logsList = logsList.filter((l) => l.severity === severity)
    }
    if (status) {
      logsList = logsList.filter((l) => l.status === status)
    }
    if (startDate) {
      const start = new Date(startDate)
      logsList = logsList.filter((l) => new Date(l.timestamp) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      logsList = logsList.filter((l) => new Date(l.timestamp) <= end)
    }
    if (search) {
      logsList = logsList.filter(
        (l) =>
          l.userName.toLowerCase().includes(search) ||
          l.action.toLowerCase().includes(search) ||
          l.resource.toLowerCase().includes(search) ||
          l.resourceId?.toLowerCase().includes(search) ||
          l.ipAddress?.toLowerCase().includes(search)
      )
    }

    // Sort by timestamp (newest first)
    logsList.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Pagination
    const total = logsList.length
    const startIndex = (page - 1) * limit
    const paginatedLogs = logsList.slice(startIndex, startIndex + limit)

    // Calculate stats
    const stats = {
      total: logsList.length,
      byAction: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {
        SUCCESS: logsList.filter((l) => l.status === 'SUCCESS').length,
        FAILURE: logsList.filter((l) => l.status === 'FAILURE').length,
      },
    }

    logsList.forEach((log) => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
    })

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/audit-logs - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      changes,
      ipAddress,
      userAgent,
      severity = 'INFO',
      status = 'SUCCESS',
      facilityId,
    } = body

    // Validate required fields
    if (!userId || !userName || !action || !resource) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userName, action, resource' },
        { status: 400 }
      )
    }

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      changes,
      ipAddress,
      userAgent,
      severity,
      status,
      facilityId,
    }

    auditLogs.set(newLog.id, newLog)

    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/audit-logs - Purge old logs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const beforeDate = searchParams.get('before')

    if (!beforeDate) {
      return NextResponse.json(
        { error: 'before date parameter is required' },
        { status: 400 }
      )
    }

    const cutoffDate = new Date(beforeDate)
    let deleted = 0

    auditLogs.forEach((log, id) => {
      if (new Date(log.timestamp) < cutoffDate) {
        auditLogs.delete(id)
        deleted++
      }
    })

    return NextResponse.json({
      success: true,
      deleted,
      message: `Purged ${deleted} logs before ${beforeDate}`,
    })
  } catch (error) {
    console.error('Error purging audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to purge audit logs' },
      { status: 500 }
    )
  }
}
