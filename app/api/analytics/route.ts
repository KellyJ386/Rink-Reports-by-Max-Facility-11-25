import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  handleApiError,
  parseDateRange,
} from '@/lib/api-utils'

interface SubmissionGroup {
  formTemplateId: string
  _count: { id: number }
}

interface IncidentGroup {
  severity: string
  _count: { id: number }
}

interface ChecklistGroup {
  status: string
  _count: { id: number }
}

interface EquipmentGroup {
  status: string
  _count: { id: number }
}

interface MaintenanceGroup {
  status: string
  _count: { id: number }
}

interface DailySubmission {
  date: Date
  count: bigint
}

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
    }

    const { searchParams } = new URL(request.url)
    const dateRange = parseDateRange(searchParams)
    const facilityId = user.facilityId

    // Set default date range if not provided (last 30 days)
    const from = dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const to = dateRange.to || new Date()

    // Get submissions by module type
    const submissionsByModule = (await prisma.submission.groupBy({
      by: ['formTemplateId'],
      where: {
        rink: { facilityId },
        submittedAt: { gte: from, lte: to },
        archivedAt: null,
      },
      _count: { id: true },
    })) as SubmissionGroup[]

    // Get form templates to map module types
    const templateIds = submissionsByModule.map((s: SubmissionGroup) => s.formTemplateId)
    const templates = await prisma.formTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, moduleType: true, name: true },
    })

    type TemplateInfo = { id: string; moduleType: string; name: string }
    const templateMap = new Map<string, TemplateInfo>(
      templates.map((t: TemplateInfo) => [t.id, t])
    )

    // Aggregate by module type
    const moduleStats: Record<string, number> = {}
    for (const submission of submissionsByModule) {
      const template = templateMap.get(submission.formTemplateId)
      if (template) {
        const moduleType = template.moduleType
        moduleStats[moduleType] = (moduleStats[moduleType] || 0) + submission._count.id
      }
    }

    // Get daily submission counts for charts
    const dailySubmissions = (await prisma.$queryRaw`
      SELECT DATE(submitted_at) as date, COUNT(*) as count
      FROM submissions s
      JOIN rinks r ON s.rink_id = r.id
      WHERE r.facility_id = ${facilityId}
        AND s.submitted_at >= ${from}
        AND s.submitted_at <= ${to}
        AND s.archived_at IS NULL
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `) as DailySubmission[]

    // Get incident counts by severity
    const incidents = (await prisma.incident.groupBy({
      by: ['severity'],
      where: {
        facilityId,
        incidentDate: { gte: from, lte: to },
      },
      _count: { id: true },
    })) as IncidentGroup[]

    // Get checklist completion stats
    const checklistStats = (await prisma.checklistInstance.groupBy({
      by: ['status'],
      where: {
        facilityId,
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
    })) as ChecklistGroup[]

    // Get equipment status counts
    const equipmentStats = (await prisma.equipment.groupBy({
      by: ['status'],
      where: { facilityId },
      _count: { id: true },
    })) as EquipmentGroup[]

    // Get maintenance records
    const maintenanceStats = (await prisma.maintenanceRecord.groupBy({
      by: ['status'],
      where: {
        equipment: { facilityId },
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
    })) as MaintenanceGroup[]

    // Calculate totals for comparison (previous period)
    const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()))
    const previousTo = from

    const currentPeriodSubmissions = await prisma.submission.count({
      where: {
        rink: { facilityId },
        submittedAt: { gte: from, lte: to },
        archivedAt: null,
      },
    })

    const previousPeriodSubmissions = await prisma.submission.count({
      where: {
        rink: { facilityId },
        submittedAt: { gte: previousFrom, lte: previousTo },
        archivedAt: null,
      },
    })

    const currentIncidents = await prisma.incident.count({
      where: {
        facilityId,
        incidentDate: { gte: from, lte: to },
      },
    })

    const previousIncidents = await prisma.incident.count({
      where: {
        facilityId,
        incidentDate: { gte: previousFrom, lte: previousTo },
      },
    })

    // Calculate percentage changes
    const submissionChange =
      previousPeriodSubmissions > 0
        ? Math.round(
            ((currentPeriodSubmissions - previousPeriodSubmissions) / previousPeriodSubmissions) *
              100
          )
        : 0

    const incidentChange =
      previousIncidents > 0
        ? Math.round(((currentIncidents - previousIncidents) / previousIncidents) * 100)
        : 0

    return successResponse({
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalSubmissions: currentPeriodSubmissions,
        submissionChange,
        totalIncidents: currentIncidents,
        incidentChange,
      },
      moduleStats,
      dailySubmissions: dailySubmissions.map((d: DailySubmission) => ({
        date: d.date.toISOString().split('T')[0],
        count: Number(d.count),
      })),
      incidentsBySeverity: incidents.reduce(
        (acc: Record<string, number>, i: IncidentGroup) => {
          acc[i.severity] = i._count.id
          return acc
        },
        {} as Record<string, number>
      ),
      checklistStats: checklistStats.reduce(
        (acc: Record<string, number>, c: ChecklistGroup) => {
          acc[c.status] = c._count.id
          return acc
        },
        {} as Record<string, number>
      ),
      equipmentStats: equipmentStats.reduce(
        (acc: Record<string, number>, e: EquipmentGroup) => {
          acc[e.status] = e._count.id
          return acc
        },
        {} as Record<string, number>
      ),
      maintenanceStats: maintenanceStats.reduce(
        (acc: Record<string, number>, m: MaintenanceGroup) => {
          acc[m.status] = m._count.id
          return acc
        },
        {} as Record<string, number>
      ),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
