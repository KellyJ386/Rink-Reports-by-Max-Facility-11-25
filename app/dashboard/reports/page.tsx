'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ReportData {
  dateRange: {
    start: string
    end: string
  }
  iceDepth: {
    totalReadings: number
    averageDepth: number | null
    avgMinDepth: number | null
    avgMaxDepth: number | null
    dailyAverages: Array<{ date: string; avgDepth: number | null }>
  }
  submissions: {
    byModule: Record<string, number>
    total: number
  }
  schedule: {
    byStatus: Record<string, number>
    openShifts: number
    emergencyShifts: number
  }
  incidents: {
    total: number
    byStatus: Record<string, number>
  }
  users: {
    total: number
    activeInPeriod: number
  }
  notifications: {
    byType: Record<string, number>
    total: number
  }
}

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incidents',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklists'
}

const EXPORT_TYPES = [
  { id: 'ice-depth', label: 'Ice Depth Readings' },
  { id: 'schedule', label: 'Schedule Entries' },
  { id: 'incidents', label: 'Incident Reports' },
  { id: 'submissions', label: 'All Submissions' },
  { id: 'users', label: 'User List' }
]

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingType, setExportingType] = useState<string | null>(null)

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to load report')
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const handleExport = async (reportType: string) => {
    setExportingType(reportType)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        type: reportType,
        format: 'csv'
      })
      const res = await fetch(`/api/reports/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') || 'report.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Export failed. Please try again.')
    } finally {
      setExportingType(null)
    }
  }

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View facility statistics and export data</p>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Update Report'}
          </button>

          <div className="flex gap-2 ml-auto">
            <button onClick={() => setQuickRange(7)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Last 7 days
            </button>
            <button onClick={() => setQuickRange(30)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Last 30 days
            </button>
            <button onClick={() => setQuickRange(90)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Last 90 days
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Submissions"
              value={data.submissions.total}
              subtitle="Form submissions"
              color="blue"
            />
            <StatCard
              title="Ice Depth Readings"
              value={data.iceDepth.totalReadings}
              subtitle={data.iceDepth.averageDepth ? `Avg: ${data.iceDepth.averageDepth.toFixed(3)}"` : 'No data'}
              color="cyan"
            />
            <StatCard
              title="Incidents Reported"
              value={data.incidents.total}
              subtitle={`${data.incidents.byStatus.PENDING_REVIEW || 0} pending review`}
              color="orange"
            />
            <StatCard
              title="Active Users"
              value={data.users.activeInPeriod}
              subtitle={`of ${data.users.total} total`}
              color="green"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Submissions by Module */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions by Module</h3>
              {Object.keys(data.submissions.byModule).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(data.submissions.byModule).map(([module, count]) => {
                    const maxCount = Math.max(...Object.values(data.submissions.byModule))
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                    return (
                      <div key={module}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{MODULE_LABELS[module] || module}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No submissions in this period</p>
              )}
            </div>

            {/* Schedule Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {data.schedule.byStatus.PUBLISHED || 0}
                  </div>
                  <div className="text-sm text-gray-600">Published Shifts</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {data.schedule.byStatus.FILLED || 0}
                  </div>
                  <div className="text-sm text-gray-600">Filled Shifts</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {data.schedule.openShifts}
                  </div>
                  <div className="text-sm text-yellow-600">Open Shifts</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {data.schedule.emergencyShifts}
                  </div>
                  <div className="text-sm text-red-600">Emergency Coverage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ice Depth Trend */}
          {data.iceDepth.dailyAverages.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ice Depth Trend</h3>
              <div className="flex items-end gap-1 h-40">
                {data.iceDepth.dailyAverages.slice(-30).map((day, idx) => {
                  const maxDepth = Math.max(
                    ...data.iceDepth.dailyAverages.map(d => d.avgDepth || 0)
                  )
                  const height = day.avgDepth && maxDepth > 0
                    ? (day.avgDepth / maxDepth) * 100
                    : 0
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-cyan-500 rounded-t hover:bg-cyan-600 transition-colors"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${new Date(day.date).toLocaleDateString()}: ${day.avgDepth?.toFixed(3) || 0}"`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>
                  {data.iceDepth.dailyAverages.length > 0
                    ? new Date(data.iceDepth.dailyAverages[0].date).toLocaleDateString()
                    : ''}
                </span>
                <span>
                  {data.iceDepth.dailyAverages.length > 0
                    ? new Date(data.iceDepth.dailyAverages[data.iceDepth.dailyAverages.length - 1].date).toLocaleDateString()
                    : ''}
                </span>
              </div>
              <div className="flex justify-center gap-8 mt-4 text-sm">
                <div>
                  <span className="text-gray-500">Min:</span>{' '}
                  <span className="font-medium">{data.iceDepth.avgMinDepth?.toFixed(3) || 'N/A'}"</span>
                </div>
                <div>
                  <span className="text-gray-500">Avg:</span>{' '}
                  <span className="font-medium">{data.iceDepth.averageDepth?.toFixed(3) || 'N/A'}"</span>
                </div>
                <div>
                  <span className="text-gray-500">Max:</span>{' '}
                  <span className="font-medium">{data.iceDepth.avgMaxDepth?.toFixed(3) || 'N/A'}"</span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications Sent</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold text-gray-900">{data.notifications.total}</span>
              <span className="text-gray-500">total notifications</span>
            </div>
            {Object.keys(data.notifications.byType).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.notifications.byType).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {type.replace(/_/g, ' ')}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No notifications sent in this period</p>
            )}
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
            <p className="text-gray-600 mb-4">Download detailed reports as CSV files</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {EXPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleExport(type.id)}
                  disabled={exportingType === type.id}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exportingType === type.id ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>📥</span>
                  )}
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  color
}: {
  title: string
  value: number
  subtitle: string
  color: 'blue' | 'cyan' | 'orange' | 'green'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    cyan: 'bg-cyan-50 border-cyan-200',
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200'
  }

  const textClasses = {
    blue: 'text-blue-700',
    cyan: 'text-cyan-700',
    orange: 'text-orange-700',
    green: 'text-green-700'
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className={`text-3xl font-bold mt-1 ${textClasses[color]}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
    </div>
  )
}
