'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DEFAULT_DEPTH_TARGETS } from '@/types/ice-depth'

interface IceDepthHistoryProps {
  user: {
    id: string
    firstName: string
    lastName: string
    facilityId: string
    canViewAll: boolean
    canExport: boolean
  }
}

interface SubmissionEntry {
  id: string
  rink: {
    id: string
    name: string
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
  }
  submittedAt: string
  outsideTemp: number | null
  outsideTempUnit: string
  stats: {
    average: number
    min: number
    max: number
    pointCount: number
  }
  status: 'optimal' | 'warning' | 'below_min' | 'above_max'
  notes: string | null
}

// Demo data for the history view
const generateDemoHistory = (): SubmissionEntry[] => {
  const statuses: Array<'optimal' | 'warning' | 'below_min' | 'above_max'> = [
    'optimal',
    'optimal',
    'optimal',
    'warning',
    'optimal',
    'below_min',
    'optimal',
    'optimal',
    'warning',
    'optimal',
  ]

  return Array.from({ length: 20 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const status = statuses[i % statuses.length]

    let average: number
    let min: number
    let max: number

    switch (status) {
      case 'below_min':
        average = 0.72
        min = 0.65
        max = 0.85
        break
      case 'warning':
        average = 0.82
        min = 0.78
        max = 0.95
        break
      case 'above_max':
        average = 1.28
        min = 1.2
        max = 1.35
        break
      default:
        average = 0.95 + Math.random() * 0.1
        min = 0.88 + Math.random() * 0.05
        max = 1.02 + Math.random() * 0.1
    }

    return {
      id: `submission-${i + 1}`,
      rink: {
        id: i % 3 === 0 ? 'rink-2' : 'rink-1',
        name: i % 3 === 0 ? 'Studio Rink' : 'Main Rink',
      },
      submittedBy: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
      },
      submittedAt: date.toISOString(),
      outsideTemp: 25 + Math.floor(Math.random() * 20),
      outsideTempUnit: 'F',
      stats: {
        average: Math.round(average * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        pointCount: i % 3 === 0 ? 25 : 35,
      },
      status,
      notes: i === 3 ? 'Ice showing wear near face-off circles' : null,
    }
  })
}

const DEMO_RINKS = [
  { id: 'all', name: 'All Rinks' },
  { id: 'rink-1', name: 'Main Rink' },
  { id: 'rink-2', name: 'Studio Rink' },
]

export default function IceDepthHistory({ user }: IceDepthHistoryProps) {
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRink, setSelectedRink] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })
  const [statusFilter, setStatusFilter] = useState('all')

  // Load submissions (using demo data for now)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSubmissions(generateDemoHistory())
      setLoading(false)
    }, 500)
  }, [])

  // Filter submissions
  const filteredSubmissions = submissions.filter((submission) => {
    if (selectedRink !== 'all' && submission.rink.id !== selectedRink) {
      return false
    }
    if (statusFilter !== 'all' && submission.status !== statusFilter) {
      return false
    }
    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      if (new Date(submission.submittedAt) < startDate) {
        return false
      }
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      if (new Date(submission.submittedAt) > endDate) {
        return false
      }
    }
    return true
  })

  // Export to CSV
  const handleExport = useCallback(() => {
    const headers = [
      'Date',
      'Time',
      'Rink',
      'Submitted By',
      'Avg Depth',
      'Min Depth',
      'Max Depth',
      'Points',
      'Status',
      'Outside Temp',
      'Notes',
    ]

    const rows = filteredSubmissions.map((s) => [
      new Date(s.submittedAt).toLocaleDateString(),
      new Date(s.submittedAt).toLocaleTimeString(),
      s.rink.name,
      `${s.submittedBy.firstName} ${s.submittedBy.lastName}`,
      s.stats.average.toFixed(2),
      s.stats.min.toFixed(2),
      s.stats.max.toFixed(2),
      s.stats.pointCount,
      s.status,
      s.outsideTemp ? `${s.outsideTemp}°${s.outsideTempUnit}` : '',
      s.notes || '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ice-depth-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredSubmissions])

  const getStatusBadge = (status: string) => {
    const styles = {
      optimal: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      below_min: 'bg-red-100 text-red-700',
      above_max: 'bg-blue-100 text-blue-700',
    }
    const labels = {
      optimal: 'Optimal',
      warning: 'Warning',
      below_min: 'Below Min',
      above_max: 'Above Max',
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/ice-depth"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Ice Depth History</h1>
          </div>
          <p className="text-gray-600 mt-1">
            {user.canViewAll
              ? 'View all ice depth submissions for your facility'
              : 'View your ice depth submissions'}
          </p>
        </div>
        {user.canExport && (
          <button
            onClick={handleExport}
            disabled={filteredSubmissions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rink
            </label>
            <select
              value={selectedRink}
              onChange={(e) => setSelectedRink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEMO_RINKS.map((rink) => (
                <option key={rink.id} value={rink.id}>
                  {rink.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="optimal">Optimal</option>
              <option value="warning">Warning</option>
              <option value="below_min">Below Minimum</option>
              <option value="above_max">Above Maximum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {(selectedRink !== 'all' ||
          statusFilter !== 'all' ||
          dateRange.start ||
          dateRange.end) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>
            <button
              onClick={() => {
                setSelectedRink('all')
                setStatusFilter('all')
                setDateRange({ start: '', end: '' })
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredSubmissions.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600 mb-1">Optimal Readings</p>
          <p className="text-2xl font-bold text-green-700">
            {filteredSubmissions.filter((s) => s.status === 'optimal').length}
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <p className="text-sm text-amber-600 mb-1">Warning Readings</p>
          <p className="text-2xl font-bold text-amber-700">
            {filteredSubmissions.filter((s) => s.status === 'warning').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-600 mb-1">Problem Readings</p>
          <p className="text-2xl font-bold text-red-700">
            {
              filteredSubmissions.filter(
                (s) => s.status === 'below_min' || s.status === 'above_max'
              ).length
            }
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No submissions found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or submit a new reading
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Rink
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Submitted By
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Avg Depth
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Min / Max
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Points
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Temp
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission, idx) => (
                  <tr
                    key={submission.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(submission.submittedAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">{submission.rink.name}</td>
                    <td className="py-3 px-4">
                      {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {submission.stats.average.toFixed(2)}&quot;
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {submission.stats.min.toFixed(2)}&quot; / {submission.stats.max.toFixed(2)}&quot;
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {submission.stats.pointCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {submission.outsideTemp
                        ? `${submission.outsideTemp}°${submission.outsideTempUnit}`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {submission.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Depth Reference */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Target Depth Reference
        </h3>
        <div className="flex gap-8 text-sm text-gray-600">
          <span>
            Minimum: <strong>{DEFAULT_DEPTH_TARGETS.min}&quot;</strong>
          </span>
          <span>
            Target: <strong>{DEFAULT_DEPTH_TARGETS.target}&quot;</strong>
          </span>
          <span>
            Maximum: <strong>{DEFAULT_DEPTH_TARGETS.max}&quot;</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
