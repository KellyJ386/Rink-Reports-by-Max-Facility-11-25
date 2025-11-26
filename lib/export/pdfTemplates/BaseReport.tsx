import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 3,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '60%',
    color: '#1e293b',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '2 solid #cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e2e8f0',
  },
  tableCell: {
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 9,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 9,
    color: '#94a3b8',
  },
  metadata: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metadataLabel: {
    width: '30%',
    fontSize: 9,
    color: '#64748b',
  },
  metadataValue: {
    width: '70%',
    fontSize: 9,
    color: '#334155',
  },
})

interface BaseReportProps {
  title: string
  facilityName?: string
  period?: {
    start: string
    end: string
  }
  generatedAt?: string
  children: React.ReactNode
}

export const BaseReport: React.FC<BaseReportProps> = ({
  title,
  facilityName,
  period,
  generatedAt,
  children,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {facilityName && (
          <Text style={styles.facilityName}>{facilityName}</Text>
        )}
        {period && (
          <Text style={styles.subtitle}>
            Period: {new Date(period.start).toLocaleDateString()} -{' '}
            {new Date(period.end).toLocaleDateString()}
          </Text>
        )}
      </View>

      {children}

      <View style={styles.metadata}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Report Generated:</Text>
          <Text style={styles.metadataValue}>
            {generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString()}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Platform:</Text>
          <Text style={styles.metadataValue}>MFO Ice Rink Management</Text>
        </View>
      </View>

      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages} - MFO Ice Rink Management © ${new Date().getFullYear()}`
        }
        fixed
      />
    </Page>
  </Document>
)

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
)

export const DataRow: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
)

export const Table: React.FC<{
  headers: string[]
  data: (string | number)[][]
  columnWidths?: string[]
}> = ({ headers, data, columnWidths }) => {
  const defaultWidths = headers.map(() => `${100 / headers.length}%`)
  const widths = columnWidths || defaultWidths

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {headers.map((header, index) => (
          <Text
            key={index}
            style={[styles.tableCell, { width: widths[index] }]}
          >
            {header}
          </Text>
        ))}
      </View>
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <Text
              key={cellIndex}
              style={[styles.tableCell, { width: widths[cellIndex] }]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

export { styles }
