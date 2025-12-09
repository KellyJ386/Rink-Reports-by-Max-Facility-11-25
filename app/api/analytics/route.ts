import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/analytics - Get comprehensive analytics for facility
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

    // Build base where clause
    const baseWhere: any = { facilityId }
    if (rinkId) baseWhere.rinkId = rinkId
    if (Object.keys(dateFilter).length > 0) baseWhere.createdAt = dateFilter

    // Get total submissions by module type
    const submissionsByModule = await prisma.submission.groupBy({
      by: ['moduleType'],
      where: baseWhere,
      _count: { id: true },
    })

    // Get total submissions count
    const totalSubmissions = await prisma.submission.count({
      where: baseWhere,
    })

    // Get draft vs submitted counts
    const draftSubmissions = await prisma.submission.count({
      where: {
        ...baseWhere,
        status: 'DRAFT',
      },
    })

    const submittedCount = await prisma.submission.count({
      where: {
        ...baseWhere,
        status: 'SUBMITTED',
      },
    })

    // Get incident statistics
    const incidentWhere = {
      ...baseWhere,
      moduleType: 'INCIDENT',
    }

    const totalIncidents = await prisma.submission.count({
      where: incidentWhere,
    })

    // Get recent incidents (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentIncidents = await prisma.submission.count({
      where: {
        ...incidentWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    // Get air quality submissions
    const airQualityCount = await prisma.submission.count({
      where: {
        ...baseWhere,
        moduleType: 'AIR_QUALITY',
      },
    })

    // Get refrigeration submissions
    const refrigerationCount = await prisma.submission.count({
      where: {
        ...baseWhere,
        moduleType: 'REFRIGERATION',
      },
    })

    // Get ice depth submissions
    const iceDepthCount = await prisma.submission.count({
      where: {
        ...baseWhere,
        moduleType: 'ICE_DEPTH',
      },
    })

    // Get daily checklist submissions
    const checklistCount = await prisma.submission.count({
      where: {
        ...baseWhere,
        moduleType: 'DAILY_CHECKLIST',
      },
    })

    // Get schedule statistics
    const scheduleWhere: any = {}
    if (rinkId) scheduleWhere.rinkId = rinkId

    const totalScheduleEntries = await prisma.scheduleEntry.count({
      where: scheduleWhere,
    })

    const openShifts = await prisma.scheduleEntry.count({
      where: {
        ...scheduleWhere,
        isOpenShift: true,
        status: 'PUBLISHED',
      },
    })

    const filledShifts = await prisma.scheduleEntry.count({
      where: {
        ...scheduleWhere,
        status: 'FILLED',
      },
    })

    const emergencyShifts = await prisma.scheduleEntry.count({
      where: {
        ...scheduleWhere,
        isEmergency: true,
      },
    })

    // Get user activity statistics
    const activeUsers = await prisma.user.count({
      where: {
        facilityId,
        isActive: true,
      },
    })

    const totalUsers = await prisma.user.count({
      where: { facilityId },
    })

    // Get recent submission trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        moduleType: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group submissions by date
    const submissionTrend = recentSubmissions.reduce((acc: any, submission) => {
      const date = submission.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, count: 0 }
      }
      acc[date].count += 1
      return acc
    }, {})

    const analytics = {
      overview: {
        totalSubmissions,
        draftSubmissions,
        submittedCount,
        totalIncidents,
        recentIncidents,
        activeUsers,
        totalUsers,
      },
      submissions: {
        byModule: submissionsByModule.reduce((acc: any, item) => {
          acc[item.moduleType] = item._count.id
          return acc
        }, {}),
        airQuality: airQualityCount,
        refrigeration: refrigerationCount,
        iceDepth: iceDepthCount,
        dailyChecklist: checklistCount,
        incidents: totalIncidents,
      },
      schedule: {
        totalEntries: totalScheduleEntries,
        openShifts,
        filledShifts,
        emergencyShifts,
        coverageRate: totalScheduleEntries > 0
          ? ((filledShifts / totalScheduleEntries) * 100).toFixed(1)
          : '0',
      },
      trends: {
        submissions: Object.values(submissionTrend),
      },
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
