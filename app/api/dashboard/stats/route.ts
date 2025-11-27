import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    // Fetch all stats in parallel
    const [
      todaySubmissions,
      weekSubmissions,
      openShifts,
      pendingIncidents,
      lastAirQuality,
      recentSubmissions,
      settings,
    ] = await Promise.all([
      // Today's submissions count
      prisma.submission.count({
        where: {
          formTemplate: { facilityId: user.facilityId },
          submittedAt: { gte: todayStart },
          archivedAt: null,
        },
      }),

      // This week's submissions count
      prisma.submission.count({
        where: {
          formTemplate: { facilityId: user.facilityId },
          submittedAt: { gte: weekStart },
          archivedAt: null,
        },
      }),

      // Open shifts count
      prisma.scheduleEntry.count({
        where: {
          user: { facilityId: user.facilityId },
          isOpenShift: true,
          status: { not: 'FILLED' },
          date: { gte: now },
        },
      }),

      // Pending incidents count
      prisma.submission.count({
        where: {
          formTemplate: {
            facilityId: user.facilityId,
            moduleType: 'INCIDENT',
          },
          status: { in: ['SUBMITTED', 'PENDING_REVIEW'] },
          archivedAt: null,
        },
      }),

      // Last air quality reading
      prisma.submission.findFirst({
        where: {
          formTemplate: {
            facilityId: user.facilityId,
            moduleType: 'AIR_QUALITY',
          },
          archivedAt: null,
        },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          submittedAt: true,
          data: true,
        },
      }),

      // Recent submissions for activity feed
      prisma.submission.findMany({
        where: {
          formTemplate: { facilityId: user.facilityId },
          archivedAt: null,
        },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          submittedAt: true,
          formTemplate: {
            select: { moduleType: true },
          },
          submittedBy: {
            select: { firstName: true, lastName: true },
          },
          rink: {
            select: { name: true },
          },
        },
      }),

      // Facility settings for thresholds
      prisma.facilitySettings.findFirst({
        where: { facilityId: user.facilityId },
      }),
    ])

    // Process air quality status
    let processedAirQuality: {
      coPpm: number
      no2Ppm: number
      submittedAt: string
      status: 'normal' | 'warning' | 'danger'
    } | null = null
    if (lastAirQuality) {
      const data = lastAirQuality.data as any
      const coWarning = settings?.coWarningPpm ?? 20
      const coEvacuation = settings?.coEvacuationPpm ?? 83
      const no2Warning = settings?.no2WarningPpm ?? 0.3
      const no2Evacuation = settings?.no2EvacuationPpm ?? 2.0

      const coPpm = data?.coPpm ?? 0
      const no2Ppm = data?.no2Ppm ?? 0

      let status: 'normal' | 'warning' | 'danger' = 'normal'
      if (coPpm >= coEvacuation || no2Ppm >= no2Evacuation) {
        status = 'danger'
      } else if (coPpm >= coWarning || no2Ppm >= no2Warning) {
        status = 'warning'
      }

      processedAirQuality = {
        coPpm,
        no2Ppm,
        submittedAt: lastAirQuality.submittedAt.toISOString(),
        status,
      }
    }

    // Process recent activity
    const recentActivity = recentSubmissions.map((s) => {
      const moduleType = s.formTemplate.moduleType
      const moduleNames: Record<string, string> = {
        ICE_DEPTH: 'Ice Depth reading',
        ICE_OPERATIONS: 'Ice Operations log',
        REFRIGERATION: 'Refrigeration reading',
        AIR_QUALITY: 'Air Quality reading',
        INCIDENT: 'Incident report',
        DAILY_CHECKLIST: 'Checklist completed',
      }

      return {
        id: s.id,
        type: 'submission',
        module: moduleType,
        description: `${moduleNames[moduleType] || 'Submission'}${s.rink ? ` - ${s.rink.name}` : ''}`,
        submittedAt: s.submittedAt.toISOString(),
        submittedBy: `${s.submittedBy.firstName} ${s.submittedBy.lastName}`,
      }
    })

    // Build alerts
    const alerts: Array<{
      id: string
      type: 'warning' | 'danger' | 'info'
      title: string
      message: string
      module: string
      link?: string
    }> = []

    // Air quality alert
    if (processedAirQuality?.status === 'danger') {
      alerts.push({
        id: 'air-quality-danger',
        type: 'danger',
        title: 'Air Quality Alert - DANGER',
        message: `CO: ${processedAirQuality.coPpm} ppm, NO2: ${processedAirQuality.no2Ppm} ppm - Evacuation levels detected`,
        module: 'AIR_QUALITY',
        link: '/dashboard/air-quality',
      })
    } else if (processedAirQuality?.status === 'warning') {
      alerts.push({
        id: 'air-quality-warning',
        type: 'warning',
        title: 'Air Quality Warning',
        message: `CO: ${processedAirQuality.coPpm} ppm, NO2: ${processedAirQuality.no2Ppm} ppm - Above normal levels`,
        module: 'AIR_QUALITY',
        link: '/dashboard/air-quality',
      })
    }

    // Open shifts alert
    if (openShifts > 0) {
      alerts.push({
        id: 'open-shifts',
        type: 'warning',
        title: 'Open Shifts',
        message: `${openShifts} shift${openShifts > 1 ? 's' : ''} need${openShifts === 1 ? 's' : ''} coverage`,
        module: 'SCHEDULE',
        link: '/dashboard/schedule/open',
      })
    }

    // Pending incidents alert
    if (pendingIncidents > 0) {
      alerts.push({
        id: 'pending-incidents',
        type: 'info',
        title: 'Pending Incidents',
        message: `${pendingIncidents} incident${pendingIncidents > 1 ? 's' : ''} pending review`,
        module: 'INCIDENT',
        link: '/dashboard/incidents',
      })
    }

    return NextResponse.json({
      todaySubmissions,
      weekSubmissions,
      openShifts,
      pendingIncidents,
      lastAirQuality: processedAirQuality,
      recentActivity,
      alerts,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
