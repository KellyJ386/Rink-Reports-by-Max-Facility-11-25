import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const facilityId = user.facilityId
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get submission counts
    const [
      todaySubmissions,
      weekSubmissions,
      monthSubmissions,
      pendingApprovals,
      myDrafts,
      recentIncidents,
    ] = await Promise.all([
      // Today's submissions
      prisma.submission.count({
        where: {
          facilityId,
          submittedAt: { gte: startOfToday },
          status: { not: 'DRAFT' },
        },
      }),
      // This week's submissions
      prisma.submission.count({
        where: {
          facilityId,
          submittedAt: { gte: startOfWeek },
          status: { not: 'DRAFT' },
        },
      }),
      // This month's submissions
      prisma.submission.count({
        where: {
          facilityId,
          submittedAt: { gte: startOfMonth },
          status: { not: 'DRAFT' },
        },
      }),
      // Pending approvals (for managers)
      prisma.submission.count({
        where: {
          facilityId,
          status: 'SUBMITTED',
        },
      }),
      // User's drafts
      prisma.submission.count({
        where: {
          facilityId,
          userId: user.id,
          status: 'DRAFT',
        },
      }),
      // Recent incidents this month
      prisma.submission.count({
        where: {
          facilityId,
          formTemplate: { moduleType: 'INCIDENT' },
          submittedAt: { gte: startOfMonth },
        },
      }),
    ])

    // Get submissions by module for the chart
    const submissionsByModule = await prisma.submission.groupBy({
      by: ['formTemplateId'],
      where: {
        facilityId,
        submittedAt: { gte: startOfMonth },
        status: { not: 'DRAFT' },
      },
      _count: true,
    })

    // Get form templates to map IDs to module types
    const formTemplates = await prisma.formTemplate.findMany({
      where: { facilityId },
      select: { id: true, moduleType: true },
    })

    const templateModuleMap = new Map(formTemplates.map(t => [t.id, t.moduleType]))

    const moduleStats: Record<string, number> = {}
    submissionsByModule.forEach(({ formTemplateId, _count }) => {
      const moduleType = templateModuleMap.get(formTemplateId) || 'OTHER'
      moduleStats[moduleType] = (moduleStats[moduleType] || 0) + _count
    })

    // Get daily submission trend for the past 7 days
    const dailyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfToday)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = await prisma.submission.count({
        where: {
          facilityId,
          submittedAt: { gte: date, lt: nextDate },
          status: { not: 'DRAFT' },
        },
      })

      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      })
    }

    // Get recent activity (last 10 actions)
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        user: { facilityId },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get air quality alerts (if any recent readings exceed thresholds)
    const facilitySettings = await prisma.facilitySettings.findUnique({
      where: { facilityId },
    })

    // Check user permissions for what stats to show
    const canViewAllSubmissions = canUserAccess(user, 'iceDepth', 'viewAll') ||
      canUserAccess(user, 'incidents', 'viewAll')
    const canApprove = canUserAccess(user, 'incidents', 'approve')

    return NextResponse.json({
      stats: {
        todaySubmissions,
        weekSubmissions,
        monthSubmissions,
        pendingApprovals: canApprove ? pendingApprovals : null,
        myDrafts,
        recentIncidents,
      },
      moduleStats,
      dailyTrend,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: `${log.user.firstName} ${log.user.lastName}`,
        createdAt: log.createdAt.toISOString(),
      })),
      thresholds: facilitySettings ? {
        coWarning: facilitySettings.coWarningPpm,
        coEvacuation: facilitySettings.coEvacuationPpm,
        no2Warning: facilitySettings.no2WarningPpm,
        no2Evacuation: facilitySettings.no2EvacuationPpm,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
