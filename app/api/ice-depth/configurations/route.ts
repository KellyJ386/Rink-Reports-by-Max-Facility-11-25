import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { PRESETS, PresetType } from '@/types/ice-depth'

// GET /api/ice-depth/configurations
// Get ice depth configurations for user's facility rinks
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to ice depth module
    if (!canUserAccess(user, 'iceDepth', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get rink ID from query params (optional - if not provided, return all)
    const { searchParams } = new URL(request.url)
    const rinkId = searchParams.get('rinkId')

    // Build query
    const where: Record<string, unknown> = {}

    if (rinkId) {
      where.rinkId = rinkId
    }

    // Get configurations
    const configurations = await prisma.iceDepthConfiguration.findMany({
      where,
      include: {
        rink: {
          select: {
            id: true,
            name: true,
            dimensions: true,
            facilityId: true,
          },
        },
      },
    })

    // Filter to only user's facility
    const filteredConfigs = configurations.filter(
      (config) => config.rink.facilityId === user.facilityId
    )

    // Get all rinks for the facility (for rinks without configuration)
    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        iceDepthConfiguration: true,
      },
    })

    // Transform response to include preset points if no custom config
    const response = rinks.map((rink) => {
      const config = rink.iceDepthConfiguration

      if (config) {
        return {
          rinkId: rink.id,
          rinkName: rink.name,
          dimensions: rink.dimensions,
          configId: config.id,
          presetType: config.presetType,
          measurementPoints: config.measurementPoints,
          backgroundImage: config.backgroundImage,
          hasCustomConfig: true,
        }
      }

      // Default to 35-point preset if no configuration
      return {
        rinkId: rink.id,
        rinkName: rink.name,
        dimensions: rink.dimensions,
        configId: null,
        presetType: 'RINK_35' as PresetType,
        measurementPoints: PRESETS.RINK_35,
        backgroundImage: null,
        hasCustomConfig: false,
      }
    })

    return NextResponse.json({ configurations: response })
  } catch (error) {
    console.error('Error fetching ice depth configurations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/ice-depth/configurations
// Create or update ice depth configuration for a rink
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access (only admins can configure)
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json(
        { error: 'Admin access required to configure ice depth' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { rinkId, presetType, measurementPoints, backgroundImage } = body

    if (!rinkId) {
      return NextResponse.json({ error: 'rinkId is required' }, { status: 400 })
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

    // Validate preset type
    const validPresets = ['RINK_25', 'RINK_35', 'RINK_47', 'CUSTOM']
    if (presetType && !validPresets.includes(presetType)) {
      return NextResponse.json(
        { error: 'Invalid preset type' },
        { status: 400 }
      )
    }

    // Get measurement points from preset if not custom
    let points = measurementPoints
    if (presetType !== 'CUSTOM' && !measurementPoints) {
      points = PRESETS[presetType as PresetType] || PRESETS.RINK_35
    }

    // Upsert configuration
    const configuration = await prisma.iceDepthConfiguration.upsert({
      where: { rinkId },
      update: {
        presetType: presetType || 'RINK_35',
        measurementPoints: points,
        backgroundImage,
        updatedAt: new Date(),
      },
      create: {
        rinkId,
        presetType: presetType || 'RINK_35',
        measurementPoints: points,
        backgroundImage,
      },
    })

    return NextResponse.json({
      message: 'Configuration saved successfully',
      configuration,
    })
  } catch (error) {
    console.error('Error saving ice depth configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
