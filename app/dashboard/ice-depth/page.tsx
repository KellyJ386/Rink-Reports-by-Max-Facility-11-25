'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IceDepthReading, formatDepth, formatDepthDifference, DEFAULT_TARGET_DEPTH } from '@/types/ice-depth'

interface DashboardData {
  rinks: {
    id: string
    name: string
    hasConfiguration: boolean
    lastReading?: IceDepthReading
  }[]
  recentReadings: IceDepthReading[]
  summary: {
    totalReadings: number
    averageDepth: number
    issueCount: number
    issueRate: number
  }
  comparison: {
    averageDepthChange: number
    issueRateChange: number
    readingsChange: number
  }
}

export default function IceDepthDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRink, setSelectedRink] = useState<string>('all')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch rinks with configurations
      const [configRes, historyRes, readingsRes] = await Promise.all([
        fetch('/api/ice-depth/config'),
        fetch('/api/ice-depth/history?period=30'),
        fetch('/api/ice-depth/readings?limit=10')
      ])

      const rinks = configRes.ok ? await configRes.json() : []
      const history = historyRes.ok ? await historyRes.json() : { summary: {}, comparison: {} }
      const readingsData = readingsRes.ok ? await readingsRes.json() : { readings: [] }

      // Get last reading for each rink
      const rinksWithLastReading = await Promise.all(
        rinks.map(async (rink: any) => {
          if (!rink.hasConfiguration) return rink
          const lastReadingRes = await fetch(`/api/ice-depth/readings?rinkId=${rink.id}&limit=1`)
          const lastReadingData = lastReadingRes.ok ? await lastReadingRes.json() : { readings: [] }
          return {
            ...rink,
            lastReading: lastReadingData.readings[0] || null
          }
        })
      )

      setData({
        rinks: rinksWithLastReading,
        recentReadings: readingsData.readings,
        summary: history.summary || {},
        comparison: history.comparison || {}
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(dateStr)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading ice depth data...</div>
      </div>
    )
  }

  const configuredRinks = data?.rinks.filter(r => r.hasConfiguration) || []
  const unconfiguredRinks = data?.rinks.filter(r => !r.hasConfiguration) || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Ice Depth Monitoring</h2>
          <p className="text-sm text-gray-500">Track and analyze ice thickness across your rinks</p>
        </div>
        <Link
          href="/dashboard/ice-depth/record"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Record Reading
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Readings This Month</div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.summary.totalReadings || 0}
          </div>
          {data?.comparison.readingsChange !== 0 && (
            <div className={`text-xs mt-1 ${
              (data?.comparison.readingsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(data?.comparison.readingsChange || 0) >= 0 ? '+' : ''}
              {Math.round(data?.comparison.readingsChange || 0)}% vs last month
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Average Depth</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatDepth(data?.summary.averageDepth || DEFAULT_TARGET_DEPTH)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Target: {formatDepth(DEFAULT_TARGET_DEPTH)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Issue Rate</div>
          <div className={`text-2xl font-bold ${
            (data?.summary.issueRate || 0) > 20 ? 'text-red-600' : 'text-green-600'
          }`}>
            {data?.summary.issueRate || 0}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data?.summary.issueCount || 0} readings with issues
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-1">Configured Rinks</div>
          <div className="text-2xl font-bold text-gray-900">
            {configuredRinks.length} / {data?.rinks.length || 0}
          </div>
          {unconfiguredRinks.length > 0 && (
            <Link
              href="/dashboard/ice-depth/configure"
              className="text-xs text-blue-600 hover:underline mt-1 block"
            >
              Configure remaining rinks
            </Link>
          )}
        </div>
      </div>

      {/* Rink Status Cards */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Rink Status</h3>

        {configuredRinks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">&#9974;</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Rinks Configured</h4>
            <p className="text-gray-500 mb-4">
              Configure your rinks with measurement points to start recording ice depth readings.
            </p>
            <Link
              href="/dashboard/ice-depth/configure"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Configure Rinks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configuredRinks.map((rink) => (
              <div
                key={rink.id}
                className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                  rink.lastReading?.hasIssues
                    ? 'border-l-red-500'
                    : rink.lastReading
                    ? 'border-l-green-500'
                    : 'border-l-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{rink.name}</h4>
                  {rink.lastReading?.hasIssues && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      Needs Attention
                    </span>
                  )}
                </div>

                {rink.lastReading ? (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Reading</span>
                        <span className="text-gray-900">{getRelativeTime(rink.lastReading.recordedAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Average Depth</span>
                        <span className="font-medium text-gray-900">
                          {formatDepth(rink.lastReading.averageDepth)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Range</span>
                        <span className="text-gray-900">
                          {formatDepth(rink.lastReading.minDepth)} - {formatDepth(rink.lastReading.maxDepth)}
                        </span>
                      </div>
                      {(rink.lastReading.pointsBelowTarget > 0 || rink.lastReading.pointsAboveTarget > 0) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Out of Tolerance</span>
                          <span className="text-amber-600">
                            {rink.lastReading.pointsBelowTarget + rink.lastReading.pointsAboveTarget} points
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/ice-depth/record?rinkId=${rink.id}`}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        Record New
                      </Link>
                      <Link
                        href={`/dashboard/ice-depth/history?rinkId=${rink.id}`}
                        className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        History
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">No readings recorded yet</p>
                    <Link
                      href={`/dashboard/ice-depth/record?rinkId=${rink.id}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors inline-block"
                    >
                      Record First Reading
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Readings */}
      {data?.recentReadings && data.recentReadings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Recent Readings</h3>
            <Link
              href="/dashboard/ice-depth/history"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rink</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Depth</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentReadings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(reading.recordedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.rink?.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatDepth(reading.averageDepth)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDepth(reading.minDepth)} - {formatDepth(reading.maxDepth)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        reading.hasIssues
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {reading.hasIssues ? 'Issues Found' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {reading.recordedBy?.firstName} {reading.recordedBy?.lastName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
