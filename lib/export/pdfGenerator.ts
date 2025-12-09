import { renderToBuffer } from '@react-pdf/renderer'
import { IncidentReport } from './pdfTemplates/IncidentReport'
import { AirQualityReport } from './pdfTemplates/AirQualityReport'
import React from 'react'

export async function generateIncidentReportPDF(
  report: any,
  facilityName?: string
): Promise<Buffer> {
  const document = React.createElement(IncidentReport, {
    report,
    facilityName,
  })

  const buffer = await renderToBuffer(document)
  return buffer
}

export async function generateAirQualityReportPDF(
  report: any,
  facilityName?: string
): Promise<Buffer> {
  const document = React.createElement(AirQualityReport, {
    report,
    facilityName,
  })

  const buffer = await renderToBuffer(document)
  return buffer
}

export async function generateComplianceReportPDF(
  report: any,
  facilityName?: string
): Promise<Buffer> {
  let document: any

  if (report.reportType === 'Incident Summary Report') {
    document = React.createElement(IncidentReport, {
      report,
      facilityName,
    })
  } else if (report.reportType === 'Air Quality Compliance Report') {
    document = React.createElement(AirQualityReport, {
      report,
      facilityName,
    })
  } else {
    throw new Error(`Unsupported report type: ${report.reportType}`)
  }

  const buffer = await renderToBuffer(document)
  return buffer
}

export function getReportFilename(
  reportType: string,
  facilityId: string,
  format: 'pdf' | 'xlsx' | 'csv',
  startDate?: Date,
  endDate?: Date
): string {
  const sanitizedType = reportType.toLowerCase().replace(/\s+/g, '-')
  const dateRange =
    startDate && endDate
      ? `_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`
      : ''

  return `${sanitizedType}_${facilityId}${dateRange}_${Date.now()}.${format}`
}
