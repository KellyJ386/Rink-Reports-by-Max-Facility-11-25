import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'

// GET /api/analytics/export - Export submissions data as CSV
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins/managers can export
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const templateId = searchParams.get('templateId')
    const status = searchParams.get('status')

    interface SubmissionWhere {
      facilityId: string
      templateId?: string
      status?: string
      submittedAt?: {
        gte?: Date
        lte?: Date
      }
    }

    const where: SubmissionWhere = {
      facilityId: user.facilityId,
    }

    if (templateId) where.templateId = templateId
    if (status) where.status = status
    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) where.submittedAt.gte = new Date(startDate)
      if (endDate) where.submittedAt.lte = new Date(endDate)
    }

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        template: {
          select: { name: true },
        },
        submitter: {
          select: { firstName: true, lastName: true, email: true },
        },
        reviewer: {
          select: { firstName: true, lastName: true },
        },
        rink: {
          select: { name: true },
        },
      },
    })

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Form Name',
        'Rink',
        'Submitted By',
        'Email',
        'Submitted At',
        'Status',
        'Reviewed By',
        'Reviewed At',
        'Review Notes',
      ]

      interface SubmissionRecord {
        id: string
        status: string
        submittedAt: Date
        reviewedAt: Date | null
        reviewNotes: string | null
        data: unknown
        template: { name: string } | null
        submitter: { firstName: string; lastName: string; email: string } | null
        reviewer: { firstName: string; lastName: string } | null
        rink: { name: string } | null
      }

      const rows = (submissions as SubmissionRecord[]).map((s) => [
        s.id,
        s.template?.name || 'Unknown',
        s.rink?.name || '',
        s.submitter ? `${s.submitter.firstName} ${s.submitter.lastName}` : 'Unknown',
        s.submitter?.email || '',
        s.submittedAt.toISOString(),
        s.status,
        s.reviewer ? `${s.reviewer.firstName} ${s.reviewer.lastName}` : '',
        s.reviewedAt?.toISOString() || '',
        s.reviewNotes || '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="submissions-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON format (default for detailed data)
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'An error occurred while exporting data' },
      { status: 500 }
    )
  }
}
