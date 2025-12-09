import Papa from 'papaparse'

export interface CSVExportOptions {
  filename?: string
  headers?: string[]
  delimiter?: string
  includeHeaders?: boolean
}

export function exportToCSV(
  data: any[],
  options: CSVExportOptions = {}
): string {
  const {
    delimiter = ',',
    includeHeaders = true,
  } = options

  const csv = Papa.unparse(data, {
    delimiter,
    header: includeHeaders,
  })

  return csv
}

export function downloadCSV(
  data: any[],
  filename: string = 'export.csv',
  options: CSVExportOptions = {}
): void {
  const csv = exportToCSV(data, options)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function submissionsToCSV(submissions: any[]): string {
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

  return exportToCSV(flattenedData)
}

export function incidentsToCSV(incidents: any[]): string {
  const flattenedData = incidents.map((incident) => {
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

  return exportToCSV(flattenedData)
}

export function airQualityToCSV(readings: any[]): string {
  const flattenedData = readings.map((reading) => {
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

  return exportToCSV(flattenedData)
}

export function auditLogsToCSV(logs: any[]): string {
  const flattenedData = logs.map((log) => {
    return {
      'Log ID': log.id,
      'Timestamp': new Date(log.createdAt).toLocaleString(),
      'User': log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'System',
      'Action': log.action,
      'Entity Type': log.entityType,
      'Entity ID': log.entityId,
      'Success': log.success ? 'Yes' : 'No',
      'IP Address': log.ipAddress || 'N/A',
      'Error Message': log.errorMessage || '',
    }
  })

  return exportToCSV(flattenedData)
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
