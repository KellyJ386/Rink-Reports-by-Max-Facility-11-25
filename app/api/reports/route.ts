import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)

    const facilityId = session.facilityId

    // Ice Depth Statistics
    const iceDepthStats = await prisma.iceDepthReading.aggregate({
      where: {
        rink: { facilityId },
        recordedAt: { gte: start, lte: end },
        archivedAt: null
      },
      _count: true,
      _avg: {
        averageDepth: true,
        minDepth: true,
        maxDepth: true
      }
    })

    const iceDepthByDay = await prisma.iceDepthReading.groupBy({
      by: ['recordedAt'],
      where: {
        rink: { facilityId },
        recordedAt: { gte: start, lte: end },
        archivedAt: null
      },
      _avg: {
        averageDepth: true
      },
      orderBy: { recordedAt: 'asc' }
    })

    // Submissions by module
    const submissionsByModule = await prisma.submission.groupBy({
      by: ['formTemplateId'],
      where: {
        formTemplate: { facilityId },
        submittedAt: { gte: start, lte: end },
        archivedAt: null
      },
      _count: true
    })

    // Get form template details for submissions
    const templateIds: string[] = []
    for (const sub of submissionsByModule) {
      templateIds.push(sub.formTemplateId)
    }

    const templates = await prisma.formTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true, moduleType: true }
    })

    // Create a map for quick lookup
    const templateMap = new Map<string, { id: string; name: string; moduleType: string }>()
    for (const template of templates) {
      templateMap.set(template.id, template)
    }

    const submissionsWithModules: Array<{ moduleType: string; moduleName: string; count: number }> = []
    for (const sub of submissionsByModule) {
      const template = templateMap.get(sub.formTemplateId)
      submissionsWithModules.push({
        moduleType: template?.moduleType || 'UNKNOWN',
        moduleName: template?.name || 'Unknown',
        count: sub._count
      })
    }

    // Aggregate by module type
    const moduleSubmissions: Record<string, number> = {}
    for (const sub of submissionsWithModules) {
      moduleSubmissions[sub.moduleType] = (moduleSubmissions[sub.moduleType] || 0) + sub.count
    }

    // Schedule Statistics
    const scheduleStats = await prisma.scheduleEntry.groupBy({
      by: ['status'],
      where: {
        facilityId,
        date: { gte: start, lte: end }
      },
      _count: true
    })

    const openShifts = await prisma.scheduleEntry.count({
      where: {
        facilityId,
        isOpenShift: true,
        date: { gte: start, lte: end }
      }
    })

    const emergencyShifts = await prisma.scheduleEntry.count({
      where: {
        facilityId,
        isEmergency: true,
        date: { gte: start, lte: end }
      }
    })

    // Incidents (from submissions with INCIDENT module type)
    const incidentSubmissions = await prisma.submission.findMany({
      where: {
        formTemplate: { facilityId, moduleType: 'INCIDENT' },
        submittedAt: { gte: start, lte: end },
        archivedAt: null
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        data: true
      }
    })

    const incidentsByStatus: Record<string, number> = {}
    for (const incident of incidentSubmissions) {
      incidentsByStatus[incident.status] = (incidentsByStatus[incident.status] || 0) + 1
    }

    // User activity
    const activeUsers = await prisma.user.count({
      where: {
        facilityId,
        isActive: true,
        lastLoginAt: { gte: start }
      }
    })

    const totalUsers = await prisma.user.count({
      where: {
        facilityId,
        isActive: true
      }
    })

    // Notifications sent
    const notificationStats = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        facilityId,
        sentAt: { gte: start, lte: end }
      },
      _count: true
    })

    // Build schedule status object
    const scheduleByStatus: Record<string, number> = {}
    for (const stat of scheduleStats) {
      scheduleByStatus[stat.status] = stat._count
    }

    // Build notifications by type object
    const notificationsByType: Record<string, number> = {}
    let notificationsTotal = 0
    for (const stat of notificationStats) {
      notificationsByType[stat.type] = stat._count
      notificationsTotal += stat._count
    }

    // Build daily averages array
    const dailyAverages: Array<{ date: Date; avgDepth: number | null }> = []
    for (const day of iceDepthByDay) {
      dailyAverages.push({
        date: day.recordedAt,
        avgDepth: day._avg.averageDepth
      })
    }

    return NextResponse.json({
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      iceDepth: {
        totalReadings: iceDepthStats._count,
        averageDepth: iceDepthStats._avg.averageDepth,
        avgMinDepth: iceDepthStats._avg.minDepth,
        avgMaxDepth: iceDepthStats._avg.maxDepth,
        dailyAverages
      },
      submissions: {
        byModule: moduleSubmissions,
        total: Object.values(moduleSubmissions).reduce((a, b) => a + b, 0)
      },
      schedule: {
        byStatus: scheduleByStatus,
        openShifts,
        emergencyShifts
      },
      incidents: {
        total: incidentSubmissions.length,
        byStatus: incidentsByStatus
      },
      users: {
        total: totalUsers,
        activeInPeriod: activeUsers
      },
      notifications: {
        byType: notificationsByType,
        total: notificationsTotal
      }
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
