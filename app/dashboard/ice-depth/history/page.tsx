'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IceDepthReading, formatDepth, DEFAULT_TARGET_DEPTH } from '@/types/ice-depth'

interface HistoryData {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  summary: {
    totalReadings: number
    averageDepth: number
    minDepth: number
    maxDepth: number
    issueCount: number
    issueRate: number
  }
  comparison: {
    averageDepthChange: number
    issueRateChange: number
    readingsChange: number
  }
  trendData: {
    date: string
    averageDepth: number
    minDepth: number
    maxDepth: number
    readings: number
    issueCount: number
  }[]
  readings: {
    id: string
    date: string
    rinkName: string
    averageDepth: number
    minDepth: number
    maxDepth: number
    hasIssues: boolean
  }[]
}

interface RinkOption {
  id: string
  name: string
}

function HistoryContent() {
  const searchParams = useSearchParams()
  const preSelectedRinkId = searchParams.get('rinkId')

  const [data, setData] = useState<HistoryData | null>(null)
  const [rinks, setRinks] = useState<RinkOption[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedRinkId, setSelectedRinkId] = useState<string>(preSelectedRinkId || '')
  const [period, setPeriod] = useState<string>('30')
  const [groupBy, setGroupBy] = useState<string>('day')

  useEffect(() => {
    fetchRinks()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [selectedRinkId, period, groupBy])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/ice-depth/config')
      if (response.ok) {
        const configs = await response.json()
        setRinks(configs.filter((r: any) => r.hasConfiguration).map((r: any) => ({
          id: r.id,
          name: r.name
        })))
      }
    } catch (error) {
      console.error('Error fetching rinks:', error)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      let url = `/api/ice-depth/history?period=${period}&groupBy=${groupBy}`
      if (selectedRinkId) url += `&rinkId=${selectedRinkId}`

      const response = await fetch(url)
      if (response.ok) {
        const historyData = await response.json()
        setData(historyData)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: period === '365' ? 'numeric' : undefined
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Simple bar chart rendering
  const maxDepth = data?.trendData ? Math.max(...data.trendData.map(d => d.maxDepth), DEFAULT_TARGET_DEPTH * 1.2) : 2
  const chartHeight = 200

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Ice Depth History</h2>
          <p className="text-sm text-gray-500">View historical trends and analyze readings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rink</label>
            <select
              value={selectedRinkId}
              onChange={(e) => setSelectedRinkId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rinks</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>{rink.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading history...</div>
      ) : !data || data.summary.totalReadings === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">&#128202;</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Readings Found</h3>
          <p className="text-gray-500 mb-4">
            No ice depth readings recorded for the selected period.
          </p>
          <Link
            href="/dashboard/ice-depth/record"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Record a Reading
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Total Readings</div>
              <div className="text-2xl font-bold text-gray-900">{data.summary.totalReadings}</div>
              {data.comparison.readingsChange !== 0 && (
                <div className={`text-xs mt-1 ${
                  data.comparison.readingsChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.comparison.readingsChange >= 0 ? '+' : ''}
                  {Math.round(data.comparison.readingsChange)}% vs previous period
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Average Depth</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatDepth(data.summary.averageDepth)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {formatDepth(DEFAULT_TARGET_DEPTH)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Depth Range</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatDepth(data.summary.minDepth)} - {formatDepth(data.summary.maxDepth)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 mb-1">Issue Rate</div>
              <div className={`text-2xl font-bold ${
                data.summary.issueRate > 20 ? 'text-red-600' : 'text-green-600'
              }`}>
                {data.summary.issueRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data.summary.issueCount} readings with issues
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-4">Depth Trend</h3>

            {data.trendData.length > 0 ? (
              <div className="relative">
                {/* Chart */}
                <div className="flex items-end gap-1" style={{ height: chartHeight }}>
                  {data.trendData.map((point, idx) => {
                    const avgHeight = (point.averageDepth / maxDepth) * chartHeight
                    const targetHeight = (DEFAULT_TARGET_DEPTH / maxDepth) * chartHeight

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group relative"
                      >
                        {/* Bar */}
                        <div
                          className="w-full max-w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                          style={{ height: avgHeight }}
                          title={`${formatDate(point.date)}: ${formatDepth(point.averageDepth)}`}
                        />

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            <div>{formatDate(point.date)}</div>
                            <div>Avg: {formatDepth(point.averageDepth)}</div>
                            <div>Range: {formatDepth(point.minDepth)} - {formatDepth(point.maxDepth)}</div>
                            <div>{point.readings} readings</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Target line */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-green-500"
                  style={{ bottom: (DEFAULT_TARGET_DEPTH / maxDepth) * chartHeight }}
                >
                  <span className="absolute -top-4 right-0 text-xs text-green-600 bg-white px-1">
                    Target {formatDepth(DEFAULT_TARGET_DEPTH)}
                  </span>
                </div>

                {/* X-axis labels */}
                <div className="flex gap-1 mt-2">
                  {data.trendData.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex-1 text-xs text-gray-500 text-center truncate"
                    >
                      {idx === 0 || idx === data.trendData.length - 1 || data.trendData.length <= 10
                        ? formatDate(point.date)
                        : ''}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Not enough data to display trend chart
              </div>
            )}
          </div>

          {/* Readings Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="font-medium text-gray-900">All Readings</h3>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rink</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Depth</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDateTime(reading.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.rinkName}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatDepth(reading.averageDepth)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDepth(reading.minDepth)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDepth(reading.maxDepth)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        reading.hasIssues
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {reading.hasIssues ? 'Issues' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  )
}
