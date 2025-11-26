import React from 'react'
import { BaseReport, Section, DataRow, Table } from './BaseReport'

interface AirQualityReportProps {
  report: {
    facilityId: string
    period: {
      start: string
      end: string
    }
    compliance: {
      totalReadings: number
      exceedanceEvents: number
      warningEvents: number
      evacuationEvents: number
      averageCO: number
      averageNO2: number
      maxCO: number
      maxNO2: number
    }
    readings: Array<{
      id: string
      date: Date
      rink: string
      coLevel: string
      no2Level: string
    }>
    generatedAt: string
  }
  facilityName?: string
}

export const AirQualityReport: React.FC<AirQualityReportProps> = ({ report, facilityName }) => {
  const readingTableData = report.readings.slice(0, 50).map((reading) => [
    new Date(reading.date).toLocaleDateString(),
    reading.rink,
    parseFloat(reading.coLevel || '0').toFixed(2),
    parseFloat(reading.no2Level || '0').toFixed(2),
  ])

  return (
    <BaseReport
      title="Air Quality Compliance Report"
      facilityName={facilityName}
      period={report.period}
      generatedAt={report.generatedAt}
    >
      <Section title="Compliance Summary">
        <DataRow label="Total Readings" value={report.compliance.totalReadings} />
        <DataRow label="Exceedance Events" value={report.compliance.exceedanceEvents} />
        <DataRow label="Warning Events" value={report.compliance.warningEvents} />
        <DataRow label="Evacuation Events" value={report.compliance.evacuationEvents} />
      </Section>

      <Section title="CO (Carbon Monoxide) Levels">
        <DataRow label="Average CO (PPM)" value={report.compliance.averageCO.toFixed(2)} />
        <DataRow label="Maximum CO (PPM)" value={report.compliance.maxCO.toFixed(2)} />
        <DataRow label="Safe Limit (PPM)" value="9" />
        <DataRow label="Evacuation Threshold (PPM)" value="35" />
      </Section>

      <Section title="NO2 (Nitrogen Dioxide) Levels">
        <DataRow label="Average NO2 (PPM)" value={report.compliance.averageNO2.toFixed(2)} />
        <DataRow label="Maximum NO2 (PPM)" value={report.compliance.maxNO2.toFixed(2)} />
        <DataRow label="Safe Limit (PPM)" value="0.5" />
        <DataRow label="Evacuation Threshold (PPM)" value="3.0" />
      </Section>

      <Section title="Recent Air Quality Readings">
        <Table
          headers={['Date', 'Rink', 'CO (PPM)', 'NO2 (PPM)']}
          data={readingTableData}
          columnWidths={['25%', '35%', '20%', '20%']}
        />
      </Section>
    </BaseReport>
  )
}
