import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/ice-depth/sessions - List ice depth sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rinkId = searchParams.get('rinkId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Find the ICE_DEPTH form template for this facility
    const formTemplate = await prisma.formTemplate.findFirst({
      where: {
        facilityId: user.facilityId,
        moduleType: 'ICE_DEPTH',
        isActive: true,
      },
    });

    if (!formTemplate) {
      return NextResponse.json({ sessions: [], total: 0 });
    }

    // Build query filters
    const where: Record<string, unknown> = {
      formTemplateId: formTemplate.id,
    };

    if (rinkId) {
      where.rinkId = rinkId;
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    // Fetch submissions (ice depth sessions are stored as submissions)
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          rink: true,
          submittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.submission.count({ where }),
    ]);

    // Transform to ice depth session format
    const sessions = submissions.map((sub) => ({
      id: sub.id,
      rinkId: sub.rinkId,
      rinkName: sub.rink.name,
      technicianId: sub.submittedById,
      technicianName: `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}`,
      templateType: (sub.data as Record<string, unknown>).templateType,
      measurements: (sub.data as Record<string, unknown>).measurements,
      airTemp: (sub.data as Record<string, unknown>).airTemp,
      iceTemp: (sub.data as Record<string, unknown>).iceTemp,
      humidity: (sub.data as Record<string, unknown>).humidity,
      notes: (sub.data as Record<string, unknown>).notes,
      status: sub.status.toLowerCase(),
      submittedAt: sub.submittedAt,
      completedAt: (sub.data as Record<string, unknown>).completedAt,
    }));

    return NextResponse.json({ sessions, total });
  } catch (error) {
    console.error('Error fetching ice depth sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/ice-depth/sessions - Create new ice depth session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      rinkId,
      templateType,
      measurements,
      airTemp,
      iceTemp,
      humidity,
      notes,
      status,
    } = body;

    // Validate required fields
    if (!rinkId || !templateType || !measurements) {
      return NextResponse.json(
        { error: 'Missing required fields: rinkId, templateType, measurements' },
        { status: 400 }
      );
    }

    // Find or create ICE_DEPTH form template for this facility
    let formTemplate = await prisma.formTemplate.findFirst({
      where: {
        facilityId: user.facilityId,
        moduleType: 'ICE_DEPTH',
        isActive: true,
      },
    });

    if (!formTemplate) {
      // Create default ice depth form template
      formTemplate = await prisma.formTemplate.create({
        data: {
          facilityId: user.facilityId,
          moduleType: 'ICE_DEPTH',
          name: 'Ice Depth Measurement',
          description: 'Standard ice depth measurement form',
          schema: {
            type: 'ice-depth',
            version: 1,
          },
          createdBy: user.id,
        },
      });
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

    // Calculate measurement statistics
    const measurementValues = Object.values(measurements as Record<string, { depth: number | null }>)
      .filter((m) => m?.depth !== null && m?.depth !== undefined)
      .map((m) => m.depth as number);

    const measurementStats = measurementValues.length > 0 ? {
      count: measurementValues.length,
      avgDepth: measurementValues.reduce((a, b) => a + b, 0) / measurementValues.length,
      minDepth: Math.min(...measurementValues),
      maxDepth: Math.max(...measurementValues),
    } : null;

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formTemplateId: formTemplate.id,
        formVersionAtSubmission: formTemplate.version,
        rinkId,
        submittedById: user.id,
        outsideTemp: airTemp,
        status: status === 'draft' ? 'DRAFT' : 'SUBMITTED',
        data: {
          templateType,
          measurements,
          airTemp,
          iceTemp,
          humidity,
          notes,
          stats: measurementStats,
          completedAt: status === 'completed' ? new Date().toISOString() : null,
        },
      },
      include: {
        rink: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Submission',
        entityId: submission.id,
        newValue: {
          moduleType: 'ICE_DEPTH',
          templateType,
          measurementCount: measurementValues.length,
          status,
        },
        submissionId: submission.id,
      },
    });

    return NextResponse.json({
      id: submission.id,
      rinkId: submission.rinkId,
      rinkName: submission.rink.name,
      technicianId: submission.submittedById,
      technicianName: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
      templateType,
      status: submission.status.toLowerCase(),
      submittedAt: submission.submittedAt,
      stats: measurementStats,
    });
  } catch (error) {
    console.error('Error creating ice depth session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
