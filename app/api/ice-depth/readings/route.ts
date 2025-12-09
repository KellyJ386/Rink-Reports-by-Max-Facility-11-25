import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { calculateReadingStats, PointMeasurement } from '@/types/ice-depth'

// GET /api/ice-depth/readings - List readings with filters
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const hasIssues = searchParams.get('hasIssues')

    // Build query
    const where: any = {
      rink: {
        facilityId: user.facilityId
      },
      archivedAt: null
    }

    if (rinkId) where.rinkId = rinkId
    if (hasIssues === 'true') where.hasIssues = true
    if (startDate || endDate) {
      where.recordedAt = {}
      if (startDate) where.recordedAt.gte = new Date(startDate)
      if (endDate) where.recordedAt.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [readings, total] = await Promise.all([
      prisma.iceDepthReading.findMany({
        where,
        include: {
          rink: {
            select: { id: true, name: true }
          },
          recordedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { recordedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.iceDepthReading.count({ where })
    ])

    return NextResponse.json({
      readings,
      total,
      limit,
      offset,
      hasMore: offset + readings.length < total
    })
  } catch (error) {
    console.error('Error fetching ice depth readings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch readings' },
      { status: 500 }
    )
  }
}

// POST /api/ice-depth/readings - Create a new reading
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.iceDepth?.submit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      rinkId,
      targetDepth,
      measurements,
      outsideTemp,
      outsideTempUnit,
      iceTemp,
      iceTempUnit,
      notes
    } = body

    // Validate required fields
    if (!rinkId) {
      return NextResponse.json({ error: 'Rink ID is required' }, { status: 400 })
    }
    if (!targetDepth || typeof targetDepth !== 'number') {
      return NextResponse.json({ error: 'Target depth is required' }, { status: 400 })
    }
    if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
      return NextResponse.json({ error: 'Measurements are required' }, { status: 400 })
    }

    // Verify rink belongs to user's facility
    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId
      }
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Validate measurements format
    const validMeasurements: PointMeasurement[] = measurements.map((m: any) => ({
      pointId: m.pointId,
      depth: parseFloat(m.depth),
      notes: m.notes || undefined
    }))

    // Calculate stats
    const stats = calculateReadingStats(validMeasurements, targetDepth)

    // Create reading
    const reading = await prisma.iceDepthReading.create({
      data: {
        rinkId,
        recordedById: user.id,
        targetDepth,
        measurements: validMeasurements,
        outsideTemp: outsideTemp || null,
        outsideTempUnit: outsideTempUnit || 'F',
        iceTemp: iceTemp || null,
        iceTempUnit: iceTempUnit || 'F',
        averageDepth: stats.averageDepth,
        minDepth: stats.minDepth,
        maxDepth: stats.maxDepth,
        pointsBelowTarget: stats.pointsBelowTarget,
        pointsAboveTarget: stats.pointsAboveTarget,
        hasIssues: stats.hasIssues,
        notes: notes || null
      },
      include: {
        rink: {
          select: { id: true, name: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    return NextResponse.json(reading, { status: 201 })
  } catch (error) {
    console.error('Error creating ice depth reading:', error)
    return NextResponse.json(
      { error: 'Failed to create reading' },
      { status: 500 }
    )
  }
}
