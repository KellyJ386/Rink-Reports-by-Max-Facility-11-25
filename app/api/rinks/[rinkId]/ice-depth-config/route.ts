import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/rinks/[rinkId]/ice-depth-config
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rinkId: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'iceDepth', 'access')) {
      return NextResponse.json({ error: 'No permission to access ice depth configuration' }, { status: 403 })
    }

    const { rinkId } = await params

    // Verify rink belongs to user's facility
    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
      include: {
        iceDepthConfiguration: true,
      },
    })

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 })
    }

    return NextResponse.json({
      config: rink.iceDepthConfiguration || {
        presetType: 'RINK_25',
        measurementPoints: [],
        backgroundImage: null,
        targetDepth: 1.25,
        optimalTolerance: 0.125,
        warningTolerance: 0.25,
      },
    })
  } catch (error) {
    console.error('Error fetching ice depth config:', error)
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
  }
}

// PUT /api/rinks/[rinkId]/ice-depth-config
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rinkId: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { rinkId } = await params
    const body = await request.json()

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

    // Validate input
    const {
      presetType,
      measurementPoints,
      backgroundImage,
      targetDepth,
      optimalTolerance,
      warningTolerance,
    } = body

    // Validate presetType if provided
    const validPresetTypes = ['RINK_9', 'RINK_13', 'RINK_25', 'RINK_49', 'CUSTOM']
    if (presetType && !validPresetTypes.includes(presetType)) {
      return NextResponse.json({ error: 'Invalid preset type' }, { status: 400 })
    }

    if (typeof targetDepth !== 'number' || targetDepth < 0.5 || targetDepth > 3) {
      return NextResponse.json(
        { error: 'Target depth must be between 0.5 and 3 inches' },
        { status: 400 }
      )
    }

    if (typeof optimalTolerance !== 'number' || optimalTolerance < 0.0625 || optimalTolerance > 0.5) {
      return NextResponse.json(
        { error: 'Optimal tolerance must be between 0.0625 and 0.5 inches' },
        { status: 400 }
      )
    }

    if (typeof warningTolerance !== 'number' || warningTolerance < 0.125 || warningTolerance > 1) {
      return NextResponse.json(
        { error: 'Warning tolerance must be between 0.125 and 1 inch' },
        { status: 400 }
      )
    }

    if (warningTolerance <= optimalTolerance) {
      return NextResponse.json(
        { error: 'Warning tolerance must be greater than optimal tolerance' },
        { status: 400 }
      )
    }

    // Validate measurement points
    if (!Array.isArray(measurementPoints)) {
      return NextResponse.json(
        { error: 'Measurement points must be an array' },
        { status: 400 }
      )
    }

    if (measurementPoints.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 measurement points allowed' },
        { status: 400 }
      )
    }

    // Validate each point
    for (const point of measurementPoints) {
      if (
        typeof point.id !== 'string' ||
        typeof point.x !== 'number' ||
        typeof point.y !== 'number' ||
        typeof point.label !== 'string' ||
        point.x < 0 || point.x > 100 ||
        point.y < 0 || point.y > 100
      ) {
        return NextResponse.json(
          { error: 'Invalid measurement point format' },
          { status: 400 }
        )
      }
    }

    // Upsert the configuration
    const config = await prisma.iceDepthConfiguration.upsert({
      where: { rinkId },
      update: {
        presetType: presetType || 'CUSTOM',
        measurementPoints,
        backgroundImage,
        targetDepth,
        optimalTolerance,
        warningTolerance,
      },
      create: {
        rinkId,
        presetType: presetType || 'CUSTOM',
        measurementPoints,
        backgroundImage,
        targetDepth,
        optimalTolerance,
        warningTolerance,
      },
    })

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error saving ice depth config:', error)
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  }
}
