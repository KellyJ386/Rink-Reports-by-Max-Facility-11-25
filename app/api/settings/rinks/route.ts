import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/settings/rinks - List all rinks for facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: Record<string, unknown> = {
      facilityId: user.facilityId
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const rinks = await prisma.rink.findMany({
      where,
      include: {
        iceDepthConfiguration: {
          select: {
            id: true,
            presetType: true
          }
        },
        _count: {
          select: {
            submissions: true,
            scheduleEntries: true,
            shiftDefinitions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const rinksWithStats = rinks.map((rink: typeof rinks[number]) => ({
      id: rink.id,
      name: rink.name,
      dimensions: rink.dimensions,
      surfaceType: rink.surfaceType,
      isActive: rink.isActive,
      createdAt: rink.createdAt,
      hasIceDepthConfig: !!rink.iceDepthConfiguration,
      iceDepthPreset: rink.iceDepthConfiguration?.presetType || null,
      stats: {
        submissions: (rink as unknown as { _count: { submissions: number } })._count.submissions,
        scheduleEntries: (rink as unknown as { _count: { scheduleEntries: number } })._count.scheduleEntries,
        shiftDefinitions: (rink as unknown as { _count: { shiftDefinitions: number } })._count.shiftDefinitions
      }
    }))

    return NextResponse.json(rinksWithStats)
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rinks' },
      { status: 500 }
    )
  }
}

// POST /api/settings/rinks - Create a new rink
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to create rinks' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, dimensions, surfaceType } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Rink name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.rink.findFirst({
      where: {
        facilityId: user.facilityId,
        name: name.trim()
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A rink with this name already exists' },
        { status: 400 }
      )
    }

    const rink = await prisma.rink.create({
      data: {
        facilityId: user.facilityId,
        name: name.trim(),
        dimensions: dimensions?.trim() || null,
        surfaceType: surfaceType || 'ice',
        isActive: true
      }
    })

    return NextResponse.json(rink, { status: 201 })
  } catch (error) {
    console.error('Error creating rink:', error)
    return NextResponse.json(
      { error: 'Failed to create rink' },
      { status: 500 }
    )
  }
}
