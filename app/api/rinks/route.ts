import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

/**
 * GET /api/rinks
 * List all rinks for the user's facility
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ rinks })
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rinks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rinks
 * Create a new rink (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    const permissions = getUserPermissions(user)
    if (user.role.name !== 'Administrator' && user.role.name !== 'Manager') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, dimensions, surfaceType, iceDepthConfig } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const rink = await prisma.rink.create({
      data: {
        facilityId: user.facilityId,
        name,
        dimensions: dimensions || null,
        surfaceType: surfaceType || 'ice',
        iceDepthConfig: iceDepthConfig || null,
      },
    })

    return NextResponse.json({ rink }, { status: 201 })
  } catch (error) {
    console.error('Error creating rink:', error)
    return NextResponse.json(
      { error: 'Failed to create rink' },
      { status: 500 }
    )
  }
}
