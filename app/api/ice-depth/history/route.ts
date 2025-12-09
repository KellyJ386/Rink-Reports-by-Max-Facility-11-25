import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/ice-depth/history - Get historical trends and stats
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.iceDepth?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rinkId = searchParams.get('rinkId')
    const period = searchParams.get('period') || '30' // days
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Build query
    const where: any = {
      rink: {
        facilityId: user.facilityId
      },
      recordedAt: {
        gte: startDate,
        lte: endDate
      },
      archivedAt: null
    }

    if (rinkId) where.rinkId = rinkId

    // Get all readings in the period
    const readings = await prisma.iceDepthReading.findMany({
      where,
      select: {
        id: true,
        rinkId: true,
        recordedAt: true,
        targetDepth: true,
        averageDepth: true,
        minDepth: true,
        maxDepth: true,
        pointsBelowTarget: true,
        pointsAboveTarget: true,
        hasIssues: true,
        rink: {
          select: { name: true }
        }
      },
      orderBy: { recordedAt: 'asc' }
    })

    // Group by date based on groupBy parameter
    const groupedData = groupReadings(readings, groupBy)

    // Calculate summary statistics
    const summary = calculateSummary(readings)

    // Get comparison with previous period
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - parseInt(period))

    const prevReadings = await prisma.iceDepthReading.findMany({
      where: {
        ...where,
        recordedAt: {
          gte: prevStartDate,
          lt: startDate
        }
      },
      select: {
        averageDepth: true,
        hasIssues: true
      }
    })

    const prevSummary = calculateSummary(prevReadings)
    const comparison = {
      averageDepthChange: prevSummary.averageDepth
        ? ((summary.averageDepth - prevSummary.averageDepth) / prevSummary.averageDepth) * 100
        : 0,
      issueRateChange: prevSummary.issueRate
        ? summary.issueRate - prevSummary.issueRate
        : 0,
      readingsChange: prevSummary.totalReadings
        ? ((summary.totalReadings - prevSummary.totalReadings) / prevSummary.totalReadings) * 100
        : 0
    }

    return NextResponse.json({
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(period)
      },
      summary,
      comparison,
      trendData: groupedData,
      readings: readings.map((r: typeof readings[number]) => ({
        id: r.id,
        date: r.recordedAt,
        rinkName: r.rink.name,
        averageDepth: r.averageDepth,
        minDepth: r.minDepth,
        maxDepth: r.maxDepth,
        hasIssues: r.hasIssues
      }))
    })
  } catch (error) {
    console.error('Error fetching ice depth history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

interface ReadingData {
  id?: string
  recordedAt?: Date
  averageDepth: number
  minDepth?: number
  maxDepth?: number
  hasIssues: boolean
  rink?: { name: string }
}

function groupReadings(readings: ReadingData[], groupBy: string) {
  const groups: Record<string, {
    date: string
    averageDepth: number
    minDepth: number
    maxDepth: number
    readings: number
    issueCount: number
  }> = {}

  readings.forEach(reading => {
    if (!reading.recordedAt) return

    const date = new Date(reading.recordedAt)
    let key: string

    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      default: // day
        key = date.toISOString().split('T')[0]
    }

    if (!groups[key]) {
      groups[key] = {
        date: key,
        averageDepth: 0,
        minDepth: Infinity,
        maxDepth: -Infinity,
        readings: 0,
        issueCount: 0
      }
    }

    groups[key].averageDepth += reading.averageDepth
    groups[key].minDepth = Math.min(groups[key].minDepth, reading.minDepth || reading.averageDepth)
    groups[key].maxDepth = Math.max(groups[key].maxDepth, reading.maxDepth || reading.averageDepth)
    groups[key].readings++
    if (reading.hasIssues) groups[key].issueCount++
  })

  // Calculate averages
  return Object.values(groups)
    .map(g => ({
      ...g,
      averageDepth: Math.round((g.averageDepth / g.readings) * 1000) / 1000,
      minDepth: g.minDepth === Infinity ? 0 : g.minDepth,
      maxDepth: g.maxDepth === -Infinity ? 0 : g.maxDepth
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function calculateSummary(readings: ReadingData[]) {
  if (readings.length === 0) {
    return {
      totalReadings: 0,
      averageDepth: 0,
      minDepth: 0,
      maxDepth: 0,
      issueCount: 0,
      issueRate: 0
    }
  }

  const totalDepth = readings.reduce((sum, r) => sum + r.averageDepth, 0)
  const issueCount = readings.filter(r => r.hasIssues).length

  return {
    totalReadings: readings.length,
    averageDepth: Math.round((totalDepth / readings.length) * 1000) / 1000,
    minDepth: Math.min(...readings.map(r => r.minDepth || r.averageDepth)),
    maxDepth: Math.max(...readings.map(r => r.maxDepth || r.averageDepth)),
    issueCount,
    issueRate: Math.round((issueCount / readings.length) * 100)
  }
}
