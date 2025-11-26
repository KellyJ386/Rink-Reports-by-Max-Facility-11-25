import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logDataExport, logAccessDenied } from '@/lib/security/auditLogger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    const facilityId = searchParams.get('facilityId')
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!facilityId || !reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: facilityId, type, startDate, endDate' },
        { status: 400 }
      )
    }

    const hasPermission = await checkPermission(userId, 'admin', 'viewAuditLogs')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ComplianceReport',
        reportType,
        'Missing admin.viewAuditLogs permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    let report: any

    switch (reportType) {
      case 'incident-summary':
        report = await generateIncidentSummaryReport(facilityId, start, end)
        break
      case 'air-quality-compliance':
        report = await generateAirQualityComplianceReport(facilityId, start, end)
        break
      case 'safety-metrics':
        report = await generateSafetyMetricsReport(facilityId, start, end)
        break
      case 'audit-trail':
        report = await generateAuditTrailReport(facilityId, start, end)
        break
      case 'user-activity':
        report = await generateUserActivityReport(facilityId, start, end)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    const { ipAddress, userAgent } = getClientInfo(request)
    await logDataExport(
      userId,
      facilityId,
      'ComplianceReport',
      reportType,
      report.recordCount || 0,
      ipAddress,
      userAgent
    )

    return NextResponse.json({ report }, { status: 200 })
  } catch (error: any) {
    console.error('Error generating compliance report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function generateIncidentSummaryReport(
  facilityId: string,
  startDate: Date,
  endDate: Date
) {
  const incidents = await prisma.submission.findMany({
    where: {
      rink: {
        facilityId,
      },
      formTemplate: {
        moduleType: 'INCIDENT',
      },
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      rink: {
        select: {
          name: true,
        },
      },
      submittedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  })

  const summary = {
    totalIncidents: incidents.length,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    ambulanceCalls: 0,
    injuries: 0,
    nearMisses: 0,
  }

  incidents.forEach((incident) => {
    const data = incident.data as any

    const incidentType = data['incident_type'] || 'Unknown'
    summary.byType[incidentType] = (summary.byType[incidentType] || 0) + 1

    const severity = data['severity'] || 'Unknown'
    summary.bySeverity[severity] = (summary.bySeverity[severity] || 0) + 1

    if (incidentType === 'Ambulance Required' || data['ambulance_called'] === 'yes') {
      summary.ambulanceCalls++
    }

    if (data['injury_occurred'] === 'yes') {
      summary.injuries++
    }

    if (severity === 'Near Miss') {
      summary.nearMisses++
    }
  })

  return {
    reportType: 'Incident Summary Report',
    facilityId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary,
    incidents: incidents.map((i) => ({
      id: i.id,
      date: i.submittedAt,
      rink: i.rink.name,
      type: (i.data as any)['incident_type'],
      severity: (i.data as any)['severity'],
      submittedBy: `${i.submittedBy.firstName} ${i.submittedBy.lastName}`,
    })),
    recordCount: incidents.length,
    generatedAt: new Date().toISOString(),
  }
}

async function generateAirQualityComplianceReport(
  facilityId: string,
  startDate: Date,
  endDate: Date
) {
  const readings = await prisma.submission.findMany({
    where: {
      rink: {
        facilityId,
      },
      formTemplate: {
        moduleType: 'AIR_QUALITY',
      },
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      rink: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  })

  const compliance = {
    totalReadings: readings.length,
    exceedanceEvents: 0,
    warningEvents: 0,
    evacuationEvents: 0,
    averageCO: 0,
    averageNO2: 0,
    maxCO: 0,
    maxNO2: 0,
  }

  let totalCO = 0
  let totalNO2 = 0
  let coReadings = 0
  let no2Readings = 0

  readings.forEach((reading) => {
    const data = reading.data as any
    const coLevel = parseFloat(data['co_level'] || '0')
    const no2Level = parseFloat(data['no2_level'] || '0')

    if (coLevel > 0) {
      totalCO += coLevel
      coReadings++
      compliance.maxCO = Math.max(compliance.maxCO, coLevel)

      if (coLevel > 35) {
        compliance.evacuationEvents++
      } else if (coLevel >= 9) {
        compliance.warningEvents++
      }
    }

    if (no2Level > 0) {
      totalNO2 += no2Level
      no2Readings++
      compliance.maxNO2 = Math.max(compliance.maxNO2, no2Level)

      if (no2Level > 3) {
        compliance.evacuationEvents++
      } else if (no2Level >= 0.5) {
        compliance.warningEvents++
      }
    }
  })

  compliance.averageCO = coReadings > 0 ? totalCO / coReadings : 0
  compliance.averageNO2 = no2Readings > 0 ? totalNO2 / no2Readings : 0
  compliance.exceedanceEvents = compliance.warningEvents + compliance.evacuationEvents

  return {
    reportType: 'Air Quality Compliance Report',
    facilityId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    compliance,
    readings: readings.map((r) => ({
      id: r.id,
      date: r.submittedAt,
      rink: r.rink.name,
      coLevel: (r.data as any)['co_level'],
      no2Level: (r.data as any)['no2_level'],
    })),
    recordCount: readings.length,
    generatedAt: new Date().toISOString(),
  }
}

async function generateSafetyMetricsReport(
  facilityId: string,
  startDate: Date,
  endDate: Date
) {
  const [incidents, airQualityReadings, totalSubmissions] = await Promise.all([
    prisma.submission.count({
      where: {
        rink: { facilityId },
        formTemplate: { moduleType: 'INCIDENT' },
        submittedAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.submission.count({
      where: {
        rink: { facilityId },
        formTemplate: { moduleType: 'AIR_QUALITY' },
        submittedAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.submission.count({
      where: {
        rink: { facilityId },
        submittedAt: { gte: startDate, lte: endDate },
      },
    }),
  ])

  const metrics = {
    totalSubmissions,
    incidentReports: incidents,
    airQualityReadings,
    complianceRate: totalSubmissions > 0 ? ((totalSubmissions - incidents) / totalSubmissions) * 100 : 100,
  }

  return {
    reportType: 'Safety Metrics Report',
    facilityId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    metrics,
    recordCount: totalSubmissions,
    generatedAt: new Date().toISOString(),
  }
}

async function generateAuditTrailReport(
  facilityId: string,
  startDate: Date,
  endDate: Date
) {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      facilityId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1000,
  })

  const summary = {
    totalActions: auditLogs.length,
    byAction: {} as Record<string, number>,
    byUser: {} as Record<string, number>,
    failedActions: 0,
  }

  auditLogs.forEach((log) => {
    summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1

    if (log.user) {
      const userName = `${log.user.firstName} ${log.user.lastName}`
      summary.byUser[userName] = (summary.byUser[userName] || 0) + 1
    }

    if (!log.success) {
      summary.failedActions++
    }
  })

  return {
    reportType: 'Audit Trail Report',
    facilityId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      success: log.success,
      ipAddress: log.ipAddress,
    })),
    recordCount: auditLogs.length,
    generatedAt: new Date().toISOString(),
  }
}

async function generateUserActivityReport(
  facilityId: string,
  startDate: Date,
  endDate: Date
) {
  const submissions = await prisma.submission.findMany({
    where: {
      rink: { facilityId },
      submittedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      submittedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      formTemplate: {
        select: {
          moduleType: true,
        },
      },
    },
  })

  const userActivity: Record<string, any> = {}

  submissions.forEach((submission) => {
    const userId = submission.submittedBy.id
    if (!userActivity[userId]) {
      userActivity[userId] = {
        user: {
          id: userId,
          name: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
          email: submission.submittedBy.email,
        },
        totalSubmissions: 0,
        byModule: {} as Record<string, number>,
      }
    }

    userActivity[userId].totalSubmissions++
    const moduleType = submission.formTemplate.moduleType
    userActivity[userId].byModule[moduleType] =
      (userActivity[userId].byModule[moduleType] || 0) + 1
  })

  return {
    reportType: 'User Activity Report',
    facilityId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    userActivity: Object.values(userActivity),
    recordCount: Object.keys(userActivity).length,
    generatedAt: new Date().toISOString(),
  }
}
