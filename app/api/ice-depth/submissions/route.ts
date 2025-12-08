import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { IceDepthReading, calculateDepthStats } from '@/types/ice-depth'

// GET /api/ice-depth/submissions
// List ice depth submissions with optional filters
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check access
    if (!canUserAccess(user, 'iceDepth', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rinkId = searchParams.get('rinkId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Determine view permissions
    const canViewAll = canUserAccess(user, 'iceDepth', 'viewAll')
    const canViewOwn = canUserAccess(user, 'iceDepth', 'viewOwn')

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: 'No view permissions' }, { status: 403 })
    }

    // Build query
    const where: Record<string, unknown> = {
      formTemplate: {
        moduleType: 'ICE_DEPTH',
        facilityId: user.facilityId,
      },
      archivedAt: null,
    }

    // Filter by own submissions if no viewAll permission
    if (!canViewAll && canViewOwn) {
      where.submittedById = user.id
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        (where.submittedAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.submittedAt as Record<string, Date>).lte = new Date(endDate)
      }
    }

    // Get submissions
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          rink: {
            select: {
              id: true,
              name: true,
            },
          },
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.submission.count({ where }),
    ])

    // Transform submissions with calculated stats
    const transformedSubmissions = submissions.map((submission) => {
      const data = submission.data as { readings?: IceDepthReading[]; notes?: string }
      const readings = data.readings || []
      const stats = calculateDepthStats(readings)

      // Determine status based on depth
      let status = 'optimal'
      if (stats.min < 0.75) {
        status = 'below_min'
      } else if (stats.max > 1.25) {
        status = 'above_max'
      } else if (stats.min < 0.85) {
        status = 'warning'
      }

      return {
        id: submission.id,
        rink: submission.rink,
        submittedBy: submission.submittedBy,
        submittedAt: submission.submittedAt,
        outsideTemp: submission.outsideTemp,
        outsideTempUnit: submission.outsideTempUnit,
        stats: {
          average: stats.average,
          min: stats.min,
          max: stats.max,
          pointCount: stats.count,
        },
        status,
        notes: data.notes,
      }
    })

    return NextResponse.json({
      submissions: transformedSubmissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + submissions.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching ice depth submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/ice-depth/submissions
// Create a new ice depth submission
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check submit permission
    if (!canUserAccess(user, 'iceDepth', 'submit')) {
      return NextResponse.json(
        { error: 'No permission to submit ice depth readings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { rinkId, readings, outsideTemp, outsideTempUnit, notes, status } = body

    if (!rinkId) {
      return NextResponse.json({ error: 'rinkId is required' }, { status: 400 })
    }

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json(
        { error: 'At least one reading is required' },
        { status: 400 }
      )
    }

    // Verify rink belongs to user's facility
    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Get or create the ice depth form template
    let formTemplate = await prisma.formTemplate.findFirst({
      where: {
        facilityId: user.facilityId,
        moduleType: 'ICE_DEPTH',
        isActive: true,
      },
    })

    // Create default form template if none exists
    if (!formTemplate) {
      formTemplate = await prisma.formTemplate.create({
        data: {
          facilityId: user.facilityId,
          moduleType: 'ICE_DEPTH',
          name: 'Ice Depth Report',
          description: 'Standard ice depth measurement report',
          schema: {
            type: 'ice-depth',
            fields: [
              { id: 'readings', type: 'ice-depth-grid', required: true },
              { id: 'notes', type: 'text', required: false },
            ],
          },
          createdBy: user.id,
        },
      })
    }

    // Validate readings
    const validatedReadings: IceDepthReading[] = readings.map(
      (reading: IceDepthReading) => {
        if (!reading.pointId || typeof reading.depth !== 'number') {
          throw new Error('Invalid reading format')
        }
        if (reading.depth < 0 || reading.depth > 3) {
          throw new Error(`Invalid depth value: ${reading.depth}`)
        }
        return {
          pointId: reading.pointId,
          depth: Math.round(reading.depth * 100) / 100, // Round to 2 decimal places
          unit: reading.unit || 'inches',
        }
      }
    )

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formTemplateId: formTemplate.id,
        formVersionAtSubmission: formTemplate.version,
        rinkId,
        submittedById: user.id,
        outsideTemp: outsideTemp ? parseFloat(outsideTemp) : null,
        outsideTempUnit: outsideTempUnit || 'F',
        data: {
          readings: validatedReadings,
          notes: notes || null,
        },
        status: status === 'draft' ? 'DRAFT' : 'SUBMITTED',
      },
      include: {
        rink: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        newValue: {
          type: 'ICE_DEPTH',
          rinkId,
          readingCount: validatedReadings.length,
        },
        submissionId: submission.id,
      },
    })

    // Calculate stats for response
    const stats = calculateDepthStats(validatedReadings)

    return NextResponse.json({
      message: 'Ice depth reading submitted successfully',
      submission: {
        id: submission.id,
        rink: submission.rink,
        submittedBy: submission.submittedBy,
        submittedAt: submission.submittedAt,
        outsideTemp: submission.outsideTemp,
        outsideTempUnit: submission.outsideTempUnit,
        stats: {
          average: stats.average,
          min: stats.min,
          max: stats.max,
          pointCount: stats.count,
        },
        status: submission.status,
      },
    })
  } catch (error) {
    console.error('Error creating ice depth submission:', error)

    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
