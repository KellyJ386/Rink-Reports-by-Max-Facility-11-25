import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logDataExport, logAccessDenied } from '@/lib/security/auditLogger'
import { submissionsToCSV } from '@/lib/export/csvExport'
import { submissionsToExcel } from '@/lib/export/excelExport'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    const facilityId = searchParams.get('facilityId')
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'xlsx'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const moduleType = searchParams.get('moduleType')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!facilityId) {
      return NextResponse.json({ error: 'facilityId is required' }, { status: 400 })
    }

    const hasPermission = await checkPermission(
      userId,
      moduleType as any || 'admin',
      'export'
    )

    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'Submission',
        facilityId,
        'Missing export permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: any = {
      rink: {
        facilityId,
      },
    }

    if (moduleType) {
      where.formTemplate = {
        moduleType,
      }
    }

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) where.submittedAt.gte = new Date(startDate)
      if (endDate) where.submittedAt.lte = new Date(endDate)
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        rink: {
          select: {
            name: true,
          },
        },
        formTemplate: {
          select: {
            moduleType: true,
          },
        },
        submittedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5000,
    })

    let buffer: Buffer
    let mimeType: string
    let filename: string

    if (format === 'xlsx') {
      buffer = submissionsToExcel(submissions)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `submissions_export_${Date.now()}.xlsx`
    } else {
      const csv = submissionsToCSV(submissions)
      buffer = Buffer.from(csv, 'utf-8')
      mimeType = 'text/csv'
      filename = `submissions_export_${Date.now()}.csv`
    }

    const { ipAddress, userAgent } = getClientInfo(request)
    await logDataExport(
      userId,
      facilityId,
      'Submission',
      format,
      submissions.length,
      ipAddress,
      userAgent
    )

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting submissions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
