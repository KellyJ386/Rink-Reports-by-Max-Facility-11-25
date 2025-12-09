import React from 'react'
import { BaseReport, Section, DataRow, Table } from './BaseReport'

interface IncidentReportProps {
  report: {
    facilityId: string
    period: {
      start: string
      end: string
    }
    summary: {
      totalIncidents: number
      byType: Record<string, number>
      bySeverity: Record<string, number>
      ambulanceCalls: number
      injuries: number
      nearMisses: number
    }
    incidents: Array<{
      id: string
      date: Date
      rink: string
      type: string
      severity: string
      submittedBy: string
    }>
    generatedAt: string
  }
  facilityName?: string
}

export const IncidentReport: React.FC<IncidentReportProps> = ({ report, facilityName }) => {
  const incidentTypeData = Object.entries(report.summary.byType).map(([type, count]) => [
    type,
    count.toString(),
  ])

  const severityData = Object.entries(report.summary.bySeverity).map(([severity, count]) => [
    severity,
    count.toString(),
  ])

  const incidentTableData = report.incidents.map((incident) => [
    new Date(incident.date).toLocaleDateString(),
    incident.rink,
    incident.type,
    incident.severity,
    incident.submittedBy,
  ])

  return (
    <BaseReport
      title="Incident Summary Report"
      facilityName={facilityName}
      period={report.period}
      generatedAt={report.generatedAt}
    >
      <Section title="Summary Statistics">
        <DataRow label="Total Incidents" value={report.summary.totalIncidents} />
        <DataRow label="Ambulance Calls" value={report.summary.ambulanceCalls} />
        <DataRow label="Injuries" value={report.summary.injuries} />
        <DataRow label="Near Misses" value={report.summary.nearMisses} />
      </Section>

      <Section title="Incidents by Type">
        <Table headers={['Incident Type', 'Count']} data={incidentTypeData} columnWidths={['70%', '30%']} />
      </Section>

      <Section title="Incidents by Severity">
        <Table headers={['Severity', 'Count']} data={severityData} columnWidths={['70%', '30%']} />
      </Section>

      <Section title="Incident Details">
        <Table
          headers={['Date', 'Rink', 'Type', 'Severity', 'Reported By']}
          data={incidentTableData}
          columnWidths={['20%', '20%', '25%', '15%', '20%']}
        />
      </Section>
    </BaseReport>
  )
}
