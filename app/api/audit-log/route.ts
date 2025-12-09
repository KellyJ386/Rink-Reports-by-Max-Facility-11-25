import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/audit-log - List audit log entries
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')

    // Validate action parameter
    const validActions = ['CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'LOGIN', 'LOGOUT']
    if (action && !validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action filter' }, { status: 400 })
    }

    // Validate entityType parameter
    const validEntityTypes = ['User', 'Role', 'FormTemplate', 'Submission', 'Rink', 'ScheduleEntry', 'ShiftDefinition', 'Notification']
    if (entityType && !validEntityTypes.includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type filter' }, { status: 400 })
    }

    const where: any = {}

    // Filter by action
    if (action) {
      where.action = action
    }

    // Filter by entity type
    if (entityType) {
      where.entityType = entityType
    }

    // Get facility users to filter logs to this facility only
    const facilityUsers = await prisma.user.findMany({
      where: { facilityId: user.facilityId },
      select: { id: true },
    })
    const facilityUserIds = facilityUsers.map(u => u.id)

    // Filter by user - if specific userId provided, verify they belong to facility
    if (userId) {
      if (facilityUserIds.includes(userId)) {
        where.userId = userId
      } else {
        // User not in this facility, return empty results
        return NextResponse.json({ logs: [], page, totalPages: 0, total: 0 })
      }
    } else {
      // No specific user requested, show all facility users' logs
      where.userId = { in: facilityUserIds }
    }

    // Count total
    const total = await prisma.auditLog.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      logs,
      page,
      totalPages,
      total,
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
