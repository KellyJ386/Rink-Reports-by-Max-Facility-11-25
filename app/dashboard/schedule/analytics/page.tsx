'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AnalyticsData {
  period: {
    startDate: string
    endDate: string
  }
  summary: {
    totalEntries: number
    totalHours: number
    averageHoursPerEmployee: number
  }
  employeeHours: {
    userId: string
    name: string
    hours: number
    shifts: number
  }[]
  coverageByDay: {
    dayOfWeek: number
    dayName: string
    shifts: number
    hours: number
  }[]
  statusBreakdown: {
    DRAFT: number
    PUBLISHED: number
    FILLED: number
    CANCELLED: number
  }
  openShiftStats: {
    total: number
    emergency: number
    filled: number
  }
  overtimeRisk: {
    userId: string
    name: string
    hours: number
  }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() + 1)
    date.setDate(0)
    return date.toISOString().split('T')[0]
  })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [startDate, endDate])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const res = await fetch(`/api/schedule/analytics?${params}`)
      const data = await res.json()

      if (res.ok) {
        setAnalytics(data)
      } else {
        setError(data.error || 'Failed to load analytics')
      }
    } catch (err) {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json' | 'payroll') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format,
      })

      const res = await fetch(`/api/schedule/export?${params}`)

      if (res.ok) {
        const contentType = res.headers.get('content-type')

        if (format === 'csv') {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `schedule-${startDate}-to-${endDate}.csv`
          a.click()
          URL.revokeObjectURL(url)
        } else {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `schedule-${format}-${startDate}-to-${endDate}.json`
          a.click()
          URL.revokeObjectURL(url)
        }
      } else {
        const data = await res.json()
        alert(data.error || 'Export failed')
      }
    } catch (err) {
      alert('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Analytics</h1>
          <p className="text-gray-600">Insights and reports for your schedule</p>
        </div>
        <Link href="/dashboard/schedule" className="btn-secondary">
          Back to Schedule
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Date Range & Export */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn-secondary text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn-secondary text-sm"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('payroll')}
              disabled={exporting}
              className="btn-secondary text-sm"
            >
              Payroll Report
            </button>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="text-sm text-gray-500">Total Entries</div>
              <div className="text-2xl font-bold">{analytics.summary.totalEntries}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Total Hours</div>
              <div className="text-2xl font-bold">
                {analytics.summary.totalHours.toFixed(1)}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Avg Hours/Employee</div>
              <div className="text-2xl font-bold">
                {analytics.summary.averageHoursPerEmployee.toFixed(1)}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Open Shifts</div>
              <div className="text-2xl font-bold">
                {analytics.openShiftStats.total}
                {analytics.openShiftStats.emergency > 0 && (
                  <span className="text-red-500 text-sm ml-2">
                    ({analytics.openShiftStats.emergency} emergency)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h3 className="font-semibold mb-4">Status Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          status === 'PUBLISHED'
                            ? 'bg-blue-500'
                            : status === 'FILLED'
                            ? 'bg-green-500'
                            : status === 'DRAFT'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      {status}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Coverage by Day</h3>
              <div className="space-y-2">
                {analytics.coverageByDay.map(day => (
                  <div key={day.dayOfWeek} className="flex items-center gap-2">
                    <span className="w-10 text-sm text-gray-600">{day.dayName}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${Math.min(
                            (day.hours / Math.max(...analytics.coverageByDay.map(d => d.hours))) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-20 text-right">
                      {day.hours.toFixed(1)}h / {day.shifts} shifts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Hours Table */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4">Employee Hours</h3>
            {analytics.employeeHours.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No employee data for this period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">Employee</th>
                      <th className="pb-2 font-medium text-right">Shifts</th>
                      <th className="pb-2 font-medium text-right">Hours</th>
                      <th className="pb-2 font-medium text-right">Avg/Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.employeeHours.map(emp => (
                      <tr key={emp.userId} className="border-b last:border-0">
                        <td className="py-2">{emp.name}</td>
                        <td className="py-2 text-right">{emp.shifts}</td>
                        <td className="py-2 text-right">{emp.hours.toFixed(1)}</td>
                        <td className="py-2 text-right">
                          {emp.shifts > 0 ? (emp.hours / emp.shifts).toFixed(1) : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Overtime Risk */}
          {analytics.overtimeRisk.length > 0 && (
            <div className="card border-orange-200 bg-orange-50">
              <h3 className="font-semibold text-orange-800 mb-4">
                Overtime Risk Alert
              </h3>
              <div className="space-y-2">
                {analytics.overtimeRisk.map(emp => (
                  <div
                    key={emp.userId}
                    className="flex items-center justify-between text-orange-700"
                  >
                    <span>{emp.name}</span>
                    <span className="font-medium">{emp.hours.toFixed(1)} hours/week</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-orange-600 mt-3">
                These employees are scheduled for more than 40 hours in at least one week
                during this period.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
