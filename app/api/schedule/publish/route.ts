import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { publishSchedule } from '@/lib/schedule'

// POST /api/schedule/publish - Publish schedule entries for a date range
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.publish) {
      return NextResponse.json(
        { error: 'You do not have permission to publish schedules' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { startDate, endDate, rinkId } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = {
      facilityId: user.facilityId,
      status: 'DRAFT',
      date: {
        gte: start,
        lte: end
      }
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    // Get count of entries to be published
    const count = await prisma.scheduleEntry.count({ where })

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'No draft entries found in the specified date range',
        publishedCount: 0
      })
    }

    // Publish the entries
    const result = await prisma.scheduleEntry.updateMany({
      where,
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: `Published ${result.count} schedule entries`,
      publishedCount: result.count,
      dateRange: {
        startDate,
        endDate
      }
    })
  } catch (error) {
    console.error('Error publishing schedule:', error)
    return NextResponse.json(
      { error: 'Failed to publish schedule' },
      { status: 500 }
    )
  }
}

// GET /api/schedule/publish - Get publishing status for a date range
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get counts by status
    const entries = await prisma.scheduleEntry.groupBy({
      by: ['status'],
      where: {
        facilityId: user.facilityId,
        date: {
          gte: start,
          lte: end
        }
      },
      _count: true
    })

    const statusCounts = entries.reduce((acc, entry) => {
      acc[entry.status] = entry._count
      return acc
    }, {} as Record<string, number>)

    const totalEntries = entries.reduce((sum, entry) => sum + entry._count, 0)
    const draftCount = statusCounts['DRAFT'] || 0
    const publishedCount = statusCounts['PUBLISHED'] || 0
    const filledCount = statusCounts['FILLED'] || 0
    const cancelledCount = statusCounts['CANCELLED'] || 0

    return NextResponse.json({
      dateRange: { startDate, endDate },
      totalEntries,
      statusCounts: {
        draft: draftCount,
        published: publishedCount,
        filled: filledCount,
        cancelled: cancelledCount
      },
      canPublish: draftCount > 0,
      isFullyPublished: draftCount === 0 && (publishedCount > 0 || filledCount > 0)
    })
  } catch (error) {
    console.error('Error getting publish status:', error)
    return NextResponse.json(
      { error: 'Failed to get publish status' },
      { status: 500 }
    )
  }
}
