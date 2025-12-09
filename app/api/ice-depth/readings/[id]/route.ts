import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { calculateReadingStats, PointMeasurement } from '@/types/ice-depth'

// GET /api/ice-depth/readings/[id] - Get a specific reading
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.iceDepth?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const reading = await prisma.iceDepthReading.findFirst({
      where: {
        id,
        rink: {
          facilityId: user.facilityId
        }
      },
      include: {
        rink: {
          select: {
            id: true,
            name: true,
            dimensions: true,
            iceDepthConfiguration: true
          }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    if (!reading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    return NextResponse.json(reading)
  } catch (error) {
    console.error('Error fetching ice depth reading:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading' },
      { status: 500 }
    )
  }
}

// PUT /api/ice-depth/readings/[id] - Update a reading
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.iceDepth?.edit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    // Check reading exists and belongs to facility
    const existingReading = await prisma.iceDepthReading.findFirst({
      where: {
        id,
        rink: {
          facilityId: user.facilityId
        }
      }
    })

    if (!existingReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      targetDepth,
      measurements,
      outsideTemp,
      outsideTempUnit,
      iceTemp,
      iceTempUnit,
      notes
    } = body

    // Build update data
    const updateData: any = {}

    if (notes !== undefined) updateData.notes = notes
    if (outsideTemp !== undefined) updateData.outsideTemp = outsideTemp
    if (outsideTempUnit) updateData.outsideTempUnit = outsideTempUnit
    if (iceTemp !== undefined) updateData.iceTemp = iceTemp
    if (iceTempUnit) updateData.iceTempUnit = iceTempUnit

    // If measurements or targetDepth changed, recalculate stats
    if (measurements || targetDepth) {
      const newTargetDepth = targetDepth || existingReading.targetDepth
      const newMeasurements = measurements || existingReading.measurements

      const validMeasurements: PointMeasurement[] = (newMeasurements as any[]).map((m: any) => ({
        pointId: m.pointId,
        depth: parseFloat(m.depth),
        notes: m.notes || undefined
      }))

      const stats = calculateReadingStats(validMeasurements, newTargetDepth)

      updateData.targetDepth = newTargetDepth
      updateData.measurements = validMeasurements
      updateData.averageDepth = stats.averageDepth
      updateData.minDepth = stats.minDepth
      updateData.maxDepth = stats.maxDepth
      updateData.pointsBelowTarget = stats.pointsBelowTarget
      updateData.pointsAboveTarget = stats.pointsAboveTarget
      updateData.hasIssues = stats.hasIssues
    }

    const reading = await prisma.iceDepthReading.update({
      where: { id },
      data: updateData,
      include: {
        rink: {
          select: { id: true, name: true }
        },
        recordedBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    return NextResponse.json(reading)
  } catch (error) {
    console.error('Error updating ice depth reading:', error)
    return NextResponse.json(
      { error: 'Failed to update reading' },
      { status: 500 }
    )
  }
}

// DELETE /api/ice-depth/readings/[id] - Soft delete (archive) a reading
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.iceDepth?.delete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    // Check reading exists and belongs to facility
    const existingReading = await prisma.iceDepthReading.findFirst({
      where: {
        id,
        rink: {
          facilityId: user.facilityId
        }
      }
    })

    if (!existingReading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Soft delete by setting archivedAt
    await prisma.iceDepthReading.update({
      where: { id },
      data: { archivedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ice depth reading:', error)
    return NextResponse.json(
      { error: 'Failed to delete reading' },
      { status: 500 }
    )
  }
}
