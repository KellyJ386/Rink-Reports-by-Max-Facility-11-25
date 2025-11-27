import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/rinks - List all rinks for the user's facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam) || 20)) : undefined
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam) || 0) : undefined
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const search = searchParams.get('search')

    const where = {
      facility: { id: user.facilityId },
      ...(includeInactive ? {} : { isActive: true }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [rinks, total] = await Promise.all([
      prisma.rink.findMany({
        where,
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
        orderBy: { name: 'asc' },
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.rink.count({ where }),
    ])

    return NextResponse.json({ rinks, total, ...(limit !== undefined && { limit, offset: offset || 0 }) })
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json({ error: 'Failed to fetch rinks' }, { status: 500 })
  }
}

// POST /api/rinks - Create a new rink
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, dimensions, surfaceType } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Rink name is required' }, { status: 400 })
    }

    const rink = await prisma.rink.create({
      data: {
        facilityId: user.facilityId,
        name: name.trim(),
        dimensions: dimensions || null,
        surfaceType: surfaceType || 'ice',
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        surfaceType: true,
        isActive: true,
      },
    })

    return NextResponse.json({ rink }, { status: 201 })
  } catch (error) {
    console.error('Error creating rink:', error)
    return NextResponse.json({ error: 'Failed to create rink' }, { status: 500 })
  }
}
