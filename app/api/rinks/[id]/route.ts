import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/rinks/[id] - Get a single rink
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rink = await prisma.rink.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        iceDepthConfiguration: true,
        _count: {
          select: { submissions: true },
        },
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    return NextResponse.json({ rink })
  } catch (error) {
    console.error('Error fetching rink:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rink' },
      { status: 500 }
    )
  }
}

// PUT /api/rinks/[id] - Update a rink
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageSettings = canUserAccess(user, 'admin', 'manageSettings')
    if (!canManageSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rink = await prisma.rink.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, dimensions, surfaceType, isActive, iceDepthConfig } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (dimensions !== undefined) updateData.dimensions = dimensions
    if (surfaceType !== undefined) updateData.surfaceType = surfaceType
    if (isActive !== undefined) updateData.isActive = isActive
    if (iceDepthConfig !== undefined) updateData.iceDepthConfig = iceDepthConfig

    const updatedRink = await prisma.rink.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Rink',
        entityId: id,
        previousValue: {
          name: rink.name,
          dimensions: rink.dimensions,
          surfaceType: rink.surfaceType,
          isActive: rink.isActive,
        },
        newValue: updateData,
      },
    })

    return NextResponse.json({ rink: updatedRink })
  } catch (error) {
    console.error('Error updating rink:', error)
    return NextResponse.json(
      { error: 'Failed to update rink' },
      { status: 500 }
    )
  }
}

// DELETE /api/rinks/[id] - Deactivate a rink
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageSettings = canUserAccess(user, 'admin', 'manageSettings')
    if (!canManageSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rink = await prisma.rink.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Soft delete by deactivating
    await prisma.rink.update({
      where: { id },
      data: { isActive: false },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'Rink',
        entityId: id,
        previousValue: { name: rink.name, isActive: rink.isActive },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rink:', error)
    return NextResponse.json(
      { error: 'Failed to delete rink' },
      { status: 500 }
    )
  }
}
