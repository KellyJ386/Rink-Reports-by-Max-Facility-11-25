import { NextRequest, NextResponse } from 'next/server'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logDataExport, logAccessDenied } from '@/lib/security/auditLogger'
import { complianceReportToExcel } from '@/lib/export/excelExport'
import { exportToCSV } from '@/lib/export/csvExport'
import { generateComplianceReportPDF, getReportFilename } from '@/lib/export/pdfGenerator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    const facilityId = searchParams.get('facilityId')
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = (searchParams.get('format') || 'pdf') as 'pdf' | 'xlsx' | 'csv'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!facilityId || !reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: facilityId, type, startDate, endDate' },
        { status: 400 })
    }

    const hasPermission = await checkPermission(userId, 'admin', 'viewAuditLogs')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ComplianceReport',
        reportType,
        'Missing admin.viewAuditLogs permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const complianceReportResponse = await fetch(
      `${request.nextUrl.origin}/api/compliance/reports?facilityId=${facilityId}&type=${reportType}&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'x-user-id': userId,
        },
      }
    )

    if (!complianceReportResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to generate compliance report' },
        { status: 500 }
      )
    }

    const { report } = await complianceReportResponse.json()

    let buffer: Buffer
    let mimeType: string
    let filename: string

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (format === 'pdf') {
      buffer = await generateComplianceReportPDF(report, 'Facility Name')
      mimeType = 'application/pdf'
      filename = getReportFilename(reportType, facilityId, 'pdf', start, end)
    } else if (format === 'xlsx') {
      buffer = complianceReportToExcel(report)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = getReportFilename(reportType, facilityId, 'xlsx', start, end)
    } else {
      const data = report.incidents || report.readings || report.auditLogs || report.userActivity || [report.metrics]
      const csv = exportToCSV(data)
      buffer = Buffer.from(csv, 'utf-8')
      mimeType = 'text/csv'
      filename = getReportFilename(reportType, facilityId, 'csv', start, end)
    }

    const { ipAddress, userAgent } = getClientInfo(request)
    await logDataExport(
      userId,
      facilityId,
      'ComplianceReport',
      `${reportType}-${format}`,
      report.recordCount || 0,
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
    console.error('Error exporting compliance report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
