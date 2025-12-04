import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/rinks/[id]
 * Get a single rink
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const rink = await prisma.rink.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
      include: {
        iceDepthConfiguration: true,
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

/**
 * PUT /api/rinks/[id]
 * Update a rink (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (user.role.name !== 'Administrator' && user.role.name !== 'Manager') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, dimensions, surfaceType, iceDepthConfig, isActive } = body

    // Verify rink belongs to facility
    const existing = await prisma.rink.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    const rink = await prisma.rink.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(dimensions !== undefined && { dimensions }),
        ...(surfaceType !== undefined && { surfaceType }),
        ...(iceDepthConfig !== undefined && { iceDepthConfig }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ rink })
  } catch (error) {
    console.error('Error updating rink:', error)
    return NextResponse.json(
      { error: 'Failed to update rink' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rinks/[id]
 * Deactivate a rink (soft delete, admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (user.role.name !== 'Administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

    // Verify rink belongs to facility
    const existing = await prisma.rink.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    // Soft delete
    await prisma.rink.update({
      where: { id },
      data: { isActive: false },
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
