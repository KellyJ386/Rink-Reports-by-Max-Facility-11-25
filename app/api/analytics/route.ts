import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/analytics - Get dashboard analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get submission counts by status
    const submissionsByStatus = await prisma.formSubmission.groupBy({
      by: ['status'],
      where: {
        facilityId: user.facilityId,
      },
      _count: true,
    })

    // Get submissions over time (daily counts for the period)
    const submissionsOverTime = await prisma.formSubmission.findMany({
      where: {
        facilityId: user.facilityId,
        submittedAt: {
          gte: startDate,
        },
      },
      select: {
        submittedAt: true,
        status: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    })

    // Group submissions by date
    interface DailyCount {
      date: string
      total: number
      submitted: number
      approved: number
      rejected: number
    }

    const dailyCounts: Record<string, DailyCount> = {}
    const today = new Date()

    // Initialize all days in period
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyCounts[dateStr] = {
        date: dateStr,
        total: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      }
    }

    // Fill in actual counts
    interface SubmissionRecord {
      submittedAt: Date
      status: string
    }

    for (const submission of submissionsOverTime as SubmissionRecord[]) {
      const dateStr = submission.submittedAt.toISOString().split('T')[0]
      if (dailyCounts[dateStr]) {
        dailyCounts[dateStr].total++
        if (submission.status === 'submitted') dailyCounts[dateStr].submitted++
        if (submission.status === 'approved') dailyCounts[dateStr].approved++
        if (submission.status === 'rejected') dailyCounts[dateStr].rejected++
      }
    }

    // Get submissions by template
    const submissionsByTemplate = await prisma.formSubmission.groupBy({
      by: ['templateId'],
      where: {
        facilityId: user.facilityId,
        submittedAt: {
          gte: startDate,
        },
      },
      _count: true,
    })

    // Get template names
    interface TemplateGroupResult {
      templateId: string
      _count: number
    }
    const templateIds = (submissionsByTemplate as TemplateGroupResult[]).map((s) => s.templateId)
    const templates = await prisma.formTemplate.findMany({
      where: {
        id: { in: templateIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    interface TemplateInfo {
      id: string
      name: string
    }

    const templateMap = new Map(
      (templates as TemplateInfo[]).map((t) => [t.id, t.name])
    )

    // Get submissions by rink
    const submissionsByRink = await prisma.formSubmission.groupBy({
      by: ['rinkId'],
      where: {
        facilityId: user.facilityId,
        rinkId: { not: null },
        submittedAt: {
          gte: startDate,
        },
      },
      _count: true,
    })

    // Get rink names
    interface RinkGroupResult {
      rinkId: string | null
      _count: number
    }
    const rinkIds = (submissionsByRink as RinkGroupResult[])
      .map((s) => s.rinkId)
      .filter((id): id is string => id !== null)
    const rinks = await prisma.rink.findMany({
      where: {
        id: { in: rinkIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    interface RinkInfo {
      id: string
      name: string
    }

    const rinkMap = new Map((rinks as RinkInfo[]).map((r) => [r.id, r.name]))

    // Get recent submissions
    const recentSubmissions = await prisma.formSubmission.findMany({
      where: {
        facilityId: user.facilityId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
      include: {
        template: {
          select: { name: true },
        },
        submitter: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    interface RecentSubmissionRecord {
      id: string
      status: string
      submittedAt: Date
      template: { name: string } | null
      submitter: { firstName: string; lastName: string } | null
    }

    // Calculate totals
    interface StatusCount {
      status: string
      _count: number
    }

    const statusCounts = submissionsByStatus as StatusCount[]
    const totalSubmissions = statusCounts.reduce((sum, s) => sum + s._count, 0)
    const pendingCount =
      statusCounts.find((s) => s.status === 'submitted')?._count || 0
    const approvedCount =
      statusCounts.find((s) => s.status === 'approved')?._count || 0
    const rejectedCount =
      statusCounts.find((s) => s.status === 'rejected')?._count || 0
    const draftCount = statusCounts.find((s) => s.status === 'draft')?._count || 0

    // Calculate approval rate
    const reviewedTotal = approvedCount + rejectedCount
    const approvalRate = reviewedTotal > 0
      ? Math.round((approvedCount / reviewedTotal) * 100)
      : 0

    return NextResponse.json({
      summary: {
        totalSubmissions,
        pendingReview: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        drafts: draftCount,
        approvalRate,
      },
      trends: Object.values(dailyCounts),
      byTemplate: (submissionsByTemplate as TemplateGroupResult[]).map((s) => ({
        templateId: s.templateId,
        templateName: templateMap.get(s.templateId) || 'Unknown',
        count: s._count,
      })),
      byRink: (submissionsByRink as RinkGroupResult[]).map((s) => ({
        rinkId: s.rinkId,
        rinkName: s.rinkId ? rinkMap.get(s.rinkId) || 'Unknown' : 'No Rink',
        count: s._count,
      })),
      recentSubmissions: (recentSubmissions as RecentSubmissionRecord[]).map((s) => ({
        id: s.id,
        templateName: s.template?.name || 'Unknown',
        submittedBy: s.submitter
          ? `${s.submitter.firstName} ${s.submitter.lastName}`
          : 'Unknown',
        submittedAt: s.submittedAt.toISOString(),
        status: s.status,
      })),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching analytics' },
      { status: 500 }
    )
  }
}
