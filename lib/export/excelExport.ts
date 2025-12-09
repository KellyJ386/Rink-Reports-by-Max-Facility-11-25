import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  sheetName?: string
  filename?: string
}

export function exportToExcel(
  data: any[],
  options: ExcelExportOptions = {}
): Buffer {
  const {
    sheetName = 'Sheet1',
  } = options

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer as Buffer
}

export function exportToExcelMultiSheet(
  sheets: { name: string; data: any[] }[],
  filename: string = 'export.xlsx'
): Buffer {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer as Buffer
}

export function downloadExcel(
  data: any[],
  filename: string = 'export.xlsx',
  options: ExcelExportOptions = {}
): void {
  const buffer = exportToExcel(data, options)
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function submissionsToExcel(submissions: any[]): Buffer {
  const flattenedData = submissions.map((submission) => {
    const data = submission.data as any

    return {
      'Submission ID': submission.id,
      'Date': new Date(submission.submittedAt).toLocaleString(),
      'Rink': submission.rink?.name || 'N/A',
      'Module Type': submission.formTemplate?.moduleType || 'N/A',
      'Submitted By': `${submission.submittedBy?.firstName || ''} ${submission.submittedBy?.lastName || ''}`.trim() || 'N/A',
      'Status': submission.status,
      'Outside Temp': submission.outsideTemp ? `${submission.outsideTemp}°${submission.outsideTempUnit}` : 'N/A',
      ...flattenFormData(data),
    }
  })

  return exportToExcel(flattenedData, { sheetName: 'Submissions' })
}

export function incidentsToExcel(incidents: any[]): Buffer {
  const summary = generateIncidentSummary(incidents)
  const details = incidents.map((incident) => {
    const data = incident.data as any

    return {
      'Incident ID': incident.id,
      'Date': new Date(incident.submittedAt).toLocaleString(),
      'Rink': incident.rink?.name || 'N/A',
      'Type': data['incident_type'] || 'N/A',
      'Severity': data['severity'] || 'N/A',
      'Description': data['description'] || 'N/A',
      'Injury Occurred': data['injury_occurred'] || 'No',
      'Ambulance Called': data['ambulance_called'] || 'No',
      'Reported By': `${incident.submittedBy?.firstName || ''} ${incident.submittedBy?.lastName || ''}`.trim() || 'N/A',
      'Actions Taken': data['actions_taken'] || 'N/A',
      'Follow Up Required': data['follow_up_required'] || 'No',
    }
  })

  return exportToExcelMultiSheet([
    { name: 'Summary', data: [summary] },
    { name: 'Incident Details', data: details },
  ])
}

export function airQualityToExcel(readings: any[]): Buffer {
  const summary = generateAirQualitySummary(readings)
  const details = readings.map((reading) => {
    const data = reading.data as any

    return {
      'Reading ID': reading.id,
      'Date': new Date(reading.submittedAt).toLocaleString(),
      'Rink': reading.rink?.name || 'N/A',
      'CO Level (PPM)': data['co_level'] || '0',
      'NO2 Level (PPM)': data['no2_level'] || '0',
      'Temperature (°F)': reading.outsideTemp || 'N/A',
      'Recorded By': `${reading.submittedBy?.firstName || ''} ${reading.submittedBy?.lastName || ''}`.trim() || 'N/A',
      'Notes': data['notes'] || '',
    }
  })

  return exportToExcelMultiSheet([
    { name: 'Summary', data: [summary] },
    { name: 'Air Quality Readings', data: details },
  ])
}

export function complianceReportToExcel(report: any): Buffer {
  const sheets: { name: string; data: any[] }[] = []

  if (report.reportType === 'Incident Summary Report') {
    sheets.push({ name: 'Summary', data: [report.summary] })
    sheets.push({ name: 'Incidents', data: report.incidents || [] })
  } else if (report.reportType === 'Air Quality Compliance Report') {
    sheets.push({ name: 'Compliance Summary', data: [report.compliance] })
    sheets.push({ name: 'Readings', data: report.readings || [] })
  } else if (report.reportType === 'Audit Trail Report') {
    sheets.push({ name: 'Summary', data: [report.summary] })
    sheets.push({ name: 'Audit Logs', data: report.auditLogs || [] })
  } else if (report.reportType === 'User Activity Report') {
    sheets.push({ name: 'User Activity', data: report.userActivity || [] })
  } else if (report.reportType === 'Safety Metrics Report') {
    sheets.push({ name: 'Metrics', data: [report.metrics] })
  }

  return exportToExcelMultiSheet(sheets)
}

function generateIncidentSummary(incidents: any[]): any {
  const summary: any = {
    'Total Incidents': incidents.length,
    'Ambulance Calls': 0,
    'Injuries': 0,
    'Near Misses': 0,
  }

  incidents.forEach((incident) => {
    const data = incident.data as any

    if (data['incident_type'] === 'Ambulance Required' || data['ambulance_called'] === 'yes') {
      summary['Ambulance Calls']++
    }
    if (data['injury_occurred'] === 'yes') {
      summary['Injuries']++
    }
    if (data['severity'] === 'Near Miss') {
      summary['Near Misses']++
    }
  })

  return summary
}

function generateAirQualitySummary(readings: any[]): any {
  let totalCO = 0
  let totalNO2 = 0
  let coReadings = 0
  let no2Readings = 0
  let maxCO = 0
  let maxNO2 = 0

  readings.forEach((reading) => {
    const data = reading.data as any
    const coLevel = parseFloat(data['co_level'] || '0')
    const no2Level = parseFloat(data['no2_level'] || '0')

    if (coLevel > 0) {
      totalCO += coLevel
      coReadings++
      maxCO = Math.max(maxCO, coLevel)
    }

    if (no2Level > 0) {
      totalNO2 += no2Level
      no2Readings++
      maxNO2 = Math.max(maxNO2, no2Level)
    }
  })

  return {
    'Total Readings': readings.length,
    'Average CO (PPM)': coReadings > 0 ? (totalCO / coReadings).toFixed(2) : '0',
    'Max CO (PPM)': maxCO.toFixed(2),
    'Average NO2 (PPM)': no2Readings > 0 ? (totalNO2 / no2Readings).toFixed(2) : '0',
    'Max NO2 (PPM)': maxNO2.toFixed(2),
  }
}

function flattenFormData(data: any, prefix: string = ''): Record<string, any> {
  const flattened: Record<string, any> = {}

  for (const key in data) {
    const value = data[key]
    const newKey = prefix ? `${prefix}.${key}` : key

    if (value === null || value === undefined) {
      flattened[newKey] = 'N/A'
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenFormData(value, newKey))
    } else if (Array.isArray(value)) {
      flattened[newKey] = value.join(', ')
    } else {
      flattened[newKey] = value
    }
  }

  return flattened
}
