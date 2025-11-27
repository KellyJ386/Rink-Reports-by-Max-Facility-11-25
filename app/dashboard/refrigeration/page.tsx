'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  rinkId: string
  submittedAt: string
  data: any
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
}

interface Rink {
  id: string
  name: string
}

function getStatusIndicator(value: number, min: number, max: number) {
  if (value < min || value > max) {
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' }
  }
  const warningMargin = (max - min) * 0.1
  if (value < min + warningMargin || value > max - warningMargin) {
    return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  }
  return { status: 'normal', color: 'text-green-600', bg: 'bg-green-100' }
}

// Normal operating ranges (these could come from facility settings)
const ranges = {
  suctionPressure: { min: 20, max: 40, unit: 'PSI' },
  dischargePressure: { min: 150, max: 250, unit: 'PSI' },
  brineTemp: { min: 18, max: 24, unit: '°F' },
  compressorAmps: { min: 50, max: 150, unit: 'A' },
}

const PAGE_SIZE = 30

export default function RefrigerationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [total, setTotal] = useState(0)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset > 0) setLoadingMore(true)

      const [meRes, rinksRes, submissionsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/rinks'),
        fetch(`/api/submissions?moduleType=REFRIGERATION&limit=${PAGE_SIZE}&page=${Math.floor(offset / PAGE_SIZE) + 1}`),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()

      // Check permissions
      const permissions = meData.user?.role?.permissions
      if (!permissions?.refrigeration?.access) {
        router.push('/dashboard')
        return
      }

      setCanSubmit(permissions?.refrigeration?.submit || false)

      if (rinksRes.ok) {
        const rinksData = await rinksRes.json()
        setRinks(rinksData.rinks || [])
      }

      if (submissionsRes.ok) {
        const data = await submissionsRes.json()
        if (append) {
          setSubmissions(prev => [...prev, ...(data.submissions || [])])
        } else {
          setSubmissions(data.submissions || [])
        }
        setTotal(data.total || 0)
      }
    } catch (err) {
      setError('Failed to load data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const loadMore = () => {
    fetchData(submissions.length, true)
  }

  const handleShowMore = () => {
    if (displayCount < submissions.length) {
      setDisplayCount(Math.min(displayCount + PAGE_SIZE, submissions.length))
    } else if (submissions.length < total) {
      loadMore()
    }
  }

  const hasMore = displayCount < submissions.length || submissions.length < total

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  const displayedSubmissions = submissions.slice(0, displayCount)

  // Get latest reading per rink
  const latestByRink: Record<string, Submission> = {}
  submissions.forEach((s) => {
    if (!latestByRink[s.rinkId]) {
      latestByRink[s.rinkId] = s
    }
  })

  // Check for alerts in recent readings
  const alerts = submissions.slice(0, 20).filter((s) => {
    const data = s.data as any
    return (
      (data?.suctionPressure && (data.suctionPressure < ranges.suctionPressure.min || data.suctionPressure > ranges.suctionPressure.max)) ||
      (data?.dischargePressure && (data.dischargePressure < ranges.dischargePressure.min || data.dischargePressure > ranges.dischargePressure.max)) ||
      (data?.brineTemp && (data.brineTemp < ranges.brineTemp.min || data.brineTemp > ranges.brineTemp.max))
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refrigeration</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor compressor and refrigeration system readings</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/refrigeration/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Reading
          </Link>
        )}
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <h3 className="font-semibold text-red-800">System Alert</h3>
              <p className="text-red-700 text-sm">
                {alerts.length} recent reading{alerts.length > 1 ? 's' : ''} outside normal operating range
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status by Rink */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">System Status</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rinks.map((rink) => {
            const latest = latestByRink[rink.id]
            const data = latest?.data as any

            return (
              <div key={rink.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{rink.name}</h3>
                  {latest && (
                    <span className="text-xs text-gray-500">
                      {new Date(latest.submittedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {latest ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{data?.suctionPressure ?? '--'}</div>
                      <div className="text-xs text-gray-500">Suction PSI</div>
                      {data?.suctionPressure && (
                        <div className={`text-xs mt-1 ${getStatusIndicator(data.suctionPressure, ranges.suctionPressure.min, ranges.suctionPressure.max).color}`}>
                          {getStatusIndicator(data.suctionPressure, ranges.suctionPressure.min, ranges.suctionPressure.max).status}
                        </div>
                      )}
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{data?.dischargePressure ?? '--'}</div>
                      <div className="text-xs text-gray-500">Discharge PSI</div>
                      {data?.dischargePressure && (
                        <div className={`text-xs mt-1 ${getStatusIndicator(data.dischargePressure, ranges.dischargePressure.min, ranges.dischargePressure.max).color}`}>
                          {getStatusIndicator(data.dischargePressure, ranges.dischargePressure.min, ranges.dischargePressure.max).status}
                        </div>
                      )}
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{data?.brineTemp ?? '--'}</div>
                      <div className="text-xs text-gray-500">Brine Temp °F</div>
                      {data?.brineTemp && (
                        <div className={`text-xs mt-1 ${getStatusIndicator(data.brineTemp, ranges.brineTemp.min, ranges.brineTemp.max).color}`}>
                          {getStatusIndicator(data.brineTemp, ranges.brineTemp.min, ranges.brineTemp.max).status}
                        </div>
                      )}
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{data?.compressorAmps ?? '--'}</div>
                      <div className="text-xs text-gray-500">Comp. Amps</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">No readings yet</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Operating Ranges Reference */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Normal Operating Ranges</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Suction Pressure</div>
            <div className="text-lg font-bold text-blue-900">{ranges.suctionPressure.min}-{ranges.suctionPressure.max}</div>
            <div className="text-xs text-blue-600">{ranges.suctionPressure.unit}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Discharge Pressure</div>
            <div className="text-lg font-bold text-blue-900">{ranges.dischargePressure.min}-{ranges.dischargePressure.max}</div>
            <div className="text-xs text-blue-600">{ranges.dischargePressure.unit}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Brine Temperature</div>
            <div className="text-lg font-bold text-blue-900">{ranges.brineTemp.min}-{ranges.brineTemp.max}</div>
            <div className="text-xs text-blue-600">{ranges.brineTemp.unit}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Compressor Amps</div>
            <div className="text-lg font-bold text-blue-900">{ranges.compressorAmps.min}-{ranges.compressorAmps.max}</div>
            <div className="text-xs text-blue-600">{ranges.compressorAmps.unit}</div>
          </div>
        </div>
      </div>

      {/* Recent Readings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Readings</h2>
          {total > 0 && (
            <span className="text-sm text-gray-500">
              Showing {displayedSubmissions.length} of {total}
            </span>
          )}
        </div>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No readings recorded yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date/Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rink</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Suction</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Discharge</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Brine</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amps</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubmissions.map((s) => {
                    const data = s.data as any
                    const hasAlert =
                      (data?.suctionPressure && (data.suctionPressure < ranges.suctionPressure.min || data.suctionPressure > ranges.suctionPressure.max)) ||
                      (data?.dischargePressure && (data.dischargePressure < ranges.dischargePressure.min || data.dischargePressure > ranges.dischargePressure.max)) ||
                      (data?.brineTemp && (data.brineTemp < ranges.brineTemp.min || data.brineTemp > ranges.brineTemp.max))

                    return (
                      <tr key={s.id} className={`border-b border-gray-100 ${hasAlert ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{new Date(s.submittedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">{s.rink?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-right font-mono">{data?.suctionPressure ?? '--'}</td>
                        <td className="py-3 px-4 text-right font-mono">{data?.dischargePressure ?? '--'}</td>
                        <td className="py-3 px-4 text-right font-mono">{data?.brineTemp ?? '--'}</td>
                        <td className="py-3 px-4 text-right font-mono">{data?.compressorAmps ?? '--'}</td>
                        <td className="py-3 px-4">
                          {hasAlert ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Alert</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/dashboard/refrigeration/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="text-center mt-4 pt-4 border-t">
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="btn btn-secondary"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
