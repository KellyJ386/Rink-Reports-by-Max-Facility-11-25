import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ice-depth/sessions/[id] - Get single session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        rink: {
          include: {
            facility: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        formTemplate: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user has access to this facility
    if (submission.rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = submission.data as Record<string, unknown>;

    return NextResponse.json({
      id: submission.id,
      rinkId: submission.rinkId,
      rinkName: submission.rink.name,
      facilityName: submission.rink.facility.name,
      technicianId: submission.submittedById,
      technician: {
        id: submission.submittedBy.id,
        name: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
        email: submission.submittedBy.email,
      },
      templateType: data.templateType,
      measurements: data.measurements,
      airTemp: data.airTemp,
      iceTemp: data.iceTemp,
      humidity: data.humidity,
      notes: data.notes,
      stats: data.stats,
      status: submission.status.toLowerCase(),
      submittedAt: submission.submittedAt,
      completedAt: data.completedAt,
      reviewedAt: submission.reviewedAt,
      reviewNotes: submission.reviewNotes,
    });
  } catch (error) {
    console.error('Error fetching ice depth session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/ice-depth/sessions/[id] - Update session
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Fetch existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        rink: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user has access
    if (existing.rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updates to drafts or if user is the owner
    if (existing.status !== 'DRAFT' && existing.submittedById !== user.id) {
      return NextResponse.json(
        { error: 'Cannot update submitted sessions' },
        { status: 400 }
      );
    }

    const {
      measurements,
      airTemp,
      iceTemp,
      humidity,
      notes,
      status,
    } = body;

    const existingData = existing.data as Record<string, unknown>;

    // Calculate updated stats
    const measurementValues = Object.values(
      (measurements || existingData.measurements) as Record<string, { depth: number | null }>
    )
      .filter((m) => m?.depth !== null && m?.depth !== undefined)
      .map((m) => m.depth as number);

    const measurementStats = measurementValues.length > 0 ? {
      count: measurementValues.length,
      avgDepth: measurementValues.reduce((a, b) => a + b, 0) / measurementValues.length,
      minDepth: Math.min(...measurementValues),
      maxDepth: Math.max(...measurementValues),
    } : null;

    // Update submission
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        outsideTemp: airTemp ?? existing.outsideTemp,
        status: status === 'submitted' ? 'SUBMITTED' : status === 'draft' ? 'DRAFT' : existing.status,
        data: {
          ...existingData,
          measurements: measurements ?? existingData.measurements,
          airTemp: airTemp ?? existingData.airTemp,
          iceTemp: iceTemp ?? existingData.iceTemp,
          humidity: humidity ?? existingData.humidity,
          notes: notes ?? existingData.notes,
          stats: measurementStats,
          completedAt: status === 'submitted' ? new Date().toISOString() : existingData.completedAt,
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
        action: 'UPDATE',
        entityType: 'Submission',
        entityId: updated.id,
        previousValue: { status: existing.status },
        newValue: {
          status: updated.status,
          measurementCount: measurementValues.length,
        },
        submissionId: updated.id,
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status.toLowerCase(),
      stats: measurementStats,
      message: 'Session updated successfully',
    });
  } catch (error) {
    console.error('Error updating ice depth session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/ice-depth/sessions/[id] - Delete session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing submission
    const existing = await prisma.submission.findUnique({
      where: { id },
      include: {
        rink: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user has access
    if (existing.rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow deletion of drafts or by owner
    if (existing.status !== 'DRAFT' && existing.submittedById !== user.id) {
      return NextResponse.json(
        { error: 'Cannot delete submitted sessions' },
        { status: 400 }
      );
    }

    // Soft delete (archive)
    await prisma.submission.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ARCHIVE',
        entityType: 'Submission',
        entityId: id,
        previousValue: { status: existing.status },
        newValue: { archivedAt: new Date() },
      },
    });

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting ice depth session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
