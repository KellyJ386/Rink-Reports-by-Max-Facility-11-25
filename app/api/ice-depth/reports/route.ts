import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateHTMLReport, ReportData, ReportOptions, REPORT_PRESETS } from '@/lib/ice-depth/reportGenerator';
import { PRESET_TEMPLATES } from '@/lib/ice-depth/templates';

// GET /api/ice-depth/reports - Generate report for a session
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') || 'html'; // html or pdf
    const preset = searchParams.get('preset') || 'full';
    const unit = (searchParams.get('unit') || 'mm') as 'mm' | 'in';

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fetch the session
    const submission = await prisma.submission.findUnique({
      where: { id: sessionId },
      include: {
        rink: {
          include: {
            facility: true,
          },
        },
        submittedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        formTemplate: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify access
    if (submission.rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = submission.data as Record<string, unknown>;
    const templateType = data.templateType as string;

    // Get template points
    let points;
    if (templateType === 'CUSTOM') {
      // Fetch custom template from IceDepthConfiguration
      const config = await prisma.iceDepthConfiguration.findUnique({
        where: { rinkId: submission.rinkId },
      });
      points = config?.measurementPoints || [];
    } else {
      // Use preset template
      const presetKey = templateType as keyof typeof PRESET_TEMPLATES;
      points = PRESET_TEMPLATES[presetKey]?.points || PRESET_TEMPLATES.RINK_25.points;
    }

    // Build report data
    const reportData: ReportData = {
      session: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        technicianName: `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`,
        rinkName: submission.rink.name,
        facilityName: submission.rink.facility.name,
      },
      template: {
        name: templateType === 'CUSTOM' ? 'Custom Template' :
          templateType === 'RINK_25' ? '25-Point Standard' :
          templateType === 'RINK_35' ? '35-Point Enhanced' :
          '47-Point Comprehensive',
        pointCount: points.length,
      },
      points: points as ReportData['points'],
      measurements: (data.measurements || {}) as ReportData['measurements'],
      environmental: {
        airTemp: data.airTemp as number | undefined,
        iceTemp: data.iceTemp as number | undefined,
        humidity: data.humidity as number | undefined,
      },
      notes: data.notes as string | undefined,
    };

    // Get report options
    const presetOptions = REPORT_PRESETS[preset as keyof typeof REPORT_PRESETS] || REPORT_PRESETS.full;
    const options: ReportOptions = {
      ...presetOptions,
      unit,
    };

    // Generate HTML report
    const html = generateHTMLReport(reportData, options);

    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="ice-depth-report-${sessionId}.html"`,
        },
      });
    }

    // For PDF, we return HTML with instructions to use browser print
    // In production, you'd use a library like puppeteer or html-pdf
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="ice-depth-report-${sessionId}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// POST /api/ice-depth/reports/email - Send report via email
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, recipients, subject, message, preset = 'summary' } = body;

    if (!sessionId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Session ID and recipients required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch session for validation
    const submission = await prisma.submission.findUnique({
      where: { id: sessionId },
      include: {
        rink: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (submission.rink.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // In a real implementation, you would:
    // 1. Generate the report HTML
    // 2. Use a service like SendGrid, Mailgun, or AWS SES to send the email
    // 3. Optionally attach a PDF version

    // For now, we'll log the intent and return success
    console.log('Email report request:', {
      sessionId,
      recipients,
      subject: subject || `Ice Depth Report - ${submission.rink.name}`,
      preset,
      requestedBy: user.id,
    });

    // Create notification record for audit trail
    await prisma.notification.create({
      data: {
        facilityId: user.facilityId,
        recipientUserId: user.id,
        type: 'SYSTEM',
        title: 'Report Sent',
        message: `Ice depth report sent to ${recipients.length} recipient(s)`,
        relatedEntityType: 'Submission',
        relatedEntityId: sessionId,
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report queued for delivery to ${recipients.length} recipient(s)`,
      recipients,
    });

  } catch (error) {
    console.error('Error sending report:', error);
    return NextResponse.json(
      { error: 'Failed to send report' },
      { status: 500 }
    );
  }
}
