import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/analytics/incidents - Get detailed incident analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facilityId = searchParams.get('facilityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const rinkId = searchParams.get('rinkId')

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 })
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // Build where clause
    const where: any = {
      facilityId,
      moduleType: 'INCIDENT',
    }
    if (rinkId) where.rinkId = rinkId
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter

    // Get all incident submissions
    const incidents = await prisma.submission.findMany({
      where,
      select: {
        id: true,
        formData: true,
        createdAt: true,
        rinkId: true,
      },
    })

    // Parse incident data
    const incidentStats = {
      total: incidents.length,
      byType: {} as any,
      bySeverity: {} as any,
      ambulanceCalls: 0,
      injuries: 0,
      nearMisses: 0,
      equipmentFailures: 0,
      safetyViolations: 0,
    }

    incidents.forEach((incident) => {
      const data = incident.formData as any

      // Count by incident type
      const type = data['incident_type'] || 'Unknown'
      incidentStats.byType[type] = (incidentStats.byType[type] || 0) + 1

      // Count by severity
      const severity = data['severity'] || 'Unknown'
      incidentStats.bySeverity[severity] = (incidentStats.bySeverity[severity] || 0) + 1

      // Count specific categories
      if (type === 'Ambulance Required') incidentStats.ambulanceCalls += 1
      if (type === 'Injury') incidentStats.injuries += 1
      if (type === 'Near-Miss') incidentStats.nearMisses += 1
      if (type === 'Equipment Failure') incidentStats.equipmentFailures += 1
      if (type === 'Safety Violation') incidentStats.safetyViolations += 1
    })

    // Calculate trend (incidents per week for the period)
    const weeklyTrend: any = {}
    incidents.forEach((incident) => {
      const date = new Date(incident.createdAt)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyTrend[weekKey]) {
        weeklyTrend[weekKey] = { week: weekKey, count: 0 }
      }
      weeklyTrend[weekKey].count += 1
    })

    const analytics = {
      summary: incidentStats,
      trends: {
        weekly: Object.values(weeklyTrend),
      },
      recentIncidents: incidents
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((inc) => ({
          id: inc.id,
          type: (inc.formData as any)['incident_type'] || 'Unknown',
          severity: (inc.formData as any)['severity'] || 'Unknown',
          date: inc.createdAt,
        })),
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching incident analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch incident analytics' }, { status: 500 })
  }
}
