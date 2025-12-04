import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { PRESET_TEMPLATES } from '@/lib/ice-depth/templates';

// GET /api/ice-depth/templates - List all templates (presets + custom)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rinkId = searchParams.get('rinkId');

    // Build query for custom templates
    const where: Record<string, unknown> = {
      rink: {
        facilityId: user.facilityId,
      },
    };

    if (rinkId) {
      where.rinkId = rinkId;
    }

    // Fetch custom templates from IceDepthConfiguration
    const customConfigs = await prisma.iceDepthConfiguration.findMany({
      where,
      include: {
        rink: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert preset templates to response format
    const presetTemplates = Object.entries(PRESET_TEMPLATES).map(([key, template]) => ({
      id: template.id,
      name: template.name,
      presetType: key,
      pointCount: template.pointCount,
      points: template.points,
      isPreset: true,
      isCustom: false,
    }));

    // Convert custom templates to response format
    const customTemplates = customConfigs
      .filter((config) => config.presetType === 'CUSTOM')
      .map((config) => ({
        id: config.id,
        name: `Custom (${config.rink.name})`,
        presetType: 'CUSTOM',
        pointCount: (config.measurementPoints as unknown[]).length,
        points: config.measurementPoints,
        rinkId: config.rinkId,
        rinkName: config.rink.name,
        isPreset: false,
        isCustom: true,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }));

    return NextResponse.json({
      templates: [...presetTemplates, ...customTemplates],
      presetCount: presetTemplates.length,
      customCount: customTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching ice depth templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/ice-depth/templates - Create custom template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rinkId, name, points, backgroundImage } = body;

    // Validate required fields
    if (!rinkId || !points || !Array.isArray(points)) {
      return NextResponse.json(
        { error: 'Missing required fields: rinkId, points (array)' },
        { status: 400 }
      );
    }

    // Validate points structure
    for (const point of points) {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') {
        return NextResponse.json(
          { error: 'Each point must have x and y coordinates' },
          { status: 400 }
        );
      }
    }

    // Verify rink belongs to user's facility
    const rink = await prisma.rink.findFirst({
      where: {
        id: rinkId,
        facilityId: user.facilityId,
      },
    });

    if (!rink) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    // Check if configuration already exists for this rink
    const existing = await prisma.iceDepthConfiguration.findUnique({
      where: { rinkId },
    });

    let config;

    if (existing) {
      // Update existing configuration
      config = await prisma.iceDepthConfiguration.update({
        where: { rinkId },
        data: {
          presetType: 'CUSTOM',
          measurementPoints: points,
          backgroundImage,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new configuration
      config = await prisma.iceDepthConfiguration.create({
        data: {
          rinkId,
          presetType: 'CUSTOM',
          measurementPoints: points,
          backgroundImage,
        },
      });
    }

    // Also update the rink's iceDepthConfig JSON field
    await prisma.rink.update({
      where: { id: rinkId },
      data: {
        iceDepthConfig: {
          templateName: name || 'Custom Template',
          points,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      id: config.id,
      rinkId: config.rinkId,
      presetType: config.presetType,
      pointCount: points.length,
      points: config.measurementPoints,
      message: existing ? 'Template updated successfully' : 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating ice depth template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
