import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/rinks/[rinkId] - Get a specific rink
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rinkId: string }> }
) {
  try {
    const { rinkId } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        surfaceType: true,
        isActive: true,
        iceDepthConfig: true,
        iceDepthConfiguration: {
          select: {
            presetType: true,
            measurementPoints: true,
            backgroundImage: true,
            targetDepth: true,
            optimalTolerance: true,
            warningTolerance: true,
          },
        },
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    return NextResponse.json({ rink })
  } catch (error) {
    console.error('Error fetching rink:', error)
    return NextResponse.json({ error: 'Failed to fetch rink' }, { status: 500 })
  }
}

// PUT /api/rinks/[rinkId] - Update a rink
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rinkId: string }> }
) {
  try {
    const { rinkId } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify rink belongs to user's facility
    const existingRink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
    })

    if (!existingRink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, dimensions, surfaceType, isActive } = body

    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json({ error: 'Rink name cannot be empty' }, { status: 400 })
    }

    const rink = await prisma.rink.update({
      where: { id: rinkId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(dimensions !== undefined && { dimensions }),
        ...(surfaceType !== undefined && { surfaceType }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        surfaceType: true,
        isActive: true,
      },
    })

    return NextResponse.json({ rink })
  } catch (error) {
    console.error('Error updating rink:', error)
    return NextResponse.json({ error: 'Failed to update rink' }, { status: 500 })
  }
}

// DELETE /api/rinks/[rinkId] - Soft delete (deactivate) a rink
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rinkId: string }> }
) {
  try {
    const { rinkId } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin delete permissions
    if (!canUserAccess(user, 'admin', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify rink belongs to user's facility
    const existingRink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
    })

    if (!existingRink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.rink.update({
      where: { id: rinkId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Rink deactivated successfully' })
  } catch (error) {
    console.error('Error deleting rink:', error)
    return NextResponse.json({ error: 'Failed to delete rink' }, { status: 500 })
  }
}
