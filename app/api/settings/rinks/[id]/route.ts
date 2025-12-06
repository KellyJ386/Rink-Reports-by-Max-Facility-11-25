import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/settings/rinks/[id] - Get single rink
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const rink = await prisma.rink.findUnique({
      where: { id },
      include: {
        iceDepthConfiguration: true
      }
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    if (rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(rink)
  } catch (error) {
    console.error('Error fetching rink:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rink' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/rinks/[id] - Update rink
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit rinks' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, dimensions, surfaceType, isActive } = body

    const rink = await prisma.rink.findUnique({
      where: { id }
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    if (rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for duplicate name if changing
    if (name && name.trim() !== rink.name) {
      const existing = await prisma.rink.findFirst({
        where: {
          facilityId: user.facilityId,
          name: name.trim(),
          id: { not: id }
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A rink with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name.trim()
    if (dimensions !== undefined) updateData.dimensions = dimensions?.trim() || null
    if (surfaceType) updateData.surfaceType = surfaceType
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedRink = await prisma.rink.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedRink)
  } catch (error) {
    console.error('Error updating rink:', error)
    return NextResponse.json(
      { error: 'Failed to update rink' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/rinks/[id] - Delete rink (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.delete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete rinks' },
        { status: 403 }
      )
    }

    const { id } = await params

    const rink = await prisma.rink.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
            iceDepthReadings: true
          }
        }
      }
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    if (rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by deactivating if there's data
    const hasData = (rink as unknown as { _count: { submissions: number; iceDepthReadings: number } })._count.submissions > 0 ||
                    (rink as unknown as { _count: { submissions: number; iceDepthReadings: number } })._count.iceDepthReadings > 0

    if (hasData) {
      await prisma.rink.update({
        where: { id },
        data: { isActive: false }
      })
    } else {
      // Hard delete if no data
      await prisma.rink.delete({
        where: { id }
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting rink:', error)
    return NextResponse.json(
      { error: 'Failed to delete rink' },
      { status: 500 }
    )
  }
}
