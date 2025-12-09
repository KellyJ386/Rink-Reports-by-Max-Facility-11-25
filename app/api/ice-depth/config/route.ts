import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { PRESETS } from '@/types/ice-depth'

// GET /api/ice-depth/config - Get configurations for all rinks
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

    // Get rinks for this facility
    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
        ...(rinkId ? { id: rinkId } : {})
      },
      include: {
        iceDepthConfiguration: true
      },
      orderBy: { name: 'asc' }
    })

    // Transform to include config status
    const rinksWithConfig = rinks.map((rink: typeof rinks[number]) => ({
      id: rink.id,
      name: rink.name,
      dimensions: rink.dimensions,
      hasConfiguration: !!rink.iceDepthConfiguration,
      configuration: rink.iceDepthConfiguration ? {
        id: rink.iceDepthConfiguration.id,
        presetType: rink.iceDepthConfiguration.presetType,
        measurementPoints: rink.iceDepthConfiguration.measurementPoints,
        backgroundImage: rink.iceDepthConfiguration.backgroundImage,
        pointCount: Array.isArray(rink.iceDepthConfiguration.measurementPoints)
          ? (rink.iceDepthConfiguration.measurementPoints as any[]).length
          : 0
      } : null
    }))

    return NextResponse.json(rinksWithConfig)
  } catch (error) {
    console.error('Error fetching ice depth configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    )
  }
}

// POST /api/ice-depth/config - Create or update configuration for a rink
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    // Use edit permission for configuration changes
    if (!permissions.iceDepth?.edit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { rinkId, presetType, measurementPoints, backgroundImage } = body

    if (!rinkId) {
      return NextResponse.json({ error: 'Rink ID is required' }, { status: 400 })
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

    // Determine measurement points
    let points = measurementPoints
    if (presetType && presetType !== 'CUSTOM' && PRESETS[presetType as keyof typeof PRESETS]) {
      points = PRESETS[presetType as keyof typeof PRESETS].points
    }

    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Measurement points are required' },
        { status: 400 }
      )
    }

    // Upsert configuration
    const configuration = await prisma.iceDepthConfiguration.upsert({
      where: { rinkId },
      update: {
        presetType: presetType || null,
        measurementPoints: points,
        backgroundImage: backgroundImage || null
      },
      create: {
        rinkId,
        presetType: presetType || null,
        measurementPoints: points,
        backgroundImage: backgroundImage || null
      }
    })

    return NextResponse.json(configuration, { status: 201 })
  } catch (error) {
    console.error('Error saving ice depth configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
