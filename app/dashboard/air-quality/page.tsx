'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  submittedAt: string
  rinkId: string
  data: any
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
}

interface Rink {
  id: string
  name: string
}

interface Thresholds {
  coWarning: number
  coEvacuation: number
  no2Warning: number
  no2Evacuation: number
}

function getCoStatus(ppm: number, warning: number, evacuation: number) {
  if (ppm >= evacuation) return { label: 'EVACUATE', color: 'bg-red-600 text-white', urgent: true }
  if (ppm >= warning) return { label: 'Warning', color: 'bg-yellow-500 text-white', urgent: true }
  return { label: 'Normal', color: 'bg-green-500 text-white', urgent: false }
}

function getNo2Status(ppm: number, warning: number, evacuation: number) {
  if (ppm >= evacuation) return { label: 'EVACUATE', color: 'bg-red-600 text-white', urgent: true }
  if (ppm >= warning) return { label: 'Warning', color: 'bg-yellow-500 text-white', urgent: true }
  return { label: 'Normal', color: 'bg-green-500 text-white', urgent: false }
}

const PAGE_SIZE = 20

export default function AirQualityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [thresholds, setThresholds] = useState<Thresholds>({
    coWarning: 20,
    coEvacuation: 83,
    no2Warning: 0.3,
    no2Evacuation: 2.0,
  })
  const [canSubmit, setCanSubmit] = useState(false)
  const [total, setTotal] = useState(0)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [submissionsRes, rinksRes, settingsRes, meRes] = await Promise.all([
        fetch('/api/submissions?moduleType=AIR_QUALITY&limit=100'),
        fetch('/api/rinks'),
        fetch('/api/settings'),
        fetch('/api/auth/me'),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()
      if (!meData.user?.role?.permissions?.airQuality?.access) {
        router.push('/dashboard')
        return
      }
      setCanSubmit(meData.user?.role?.permissions?.airQuality?.submit || false)

      if (submissionsRes.ok) {
        const subData = await submissionsRes.json()
        setSubmissions(subData.submissions || [])
        setTotal(subData.total || subData.submissions?.length || 0)
      }

      if (rinksRes.ok) {
        const rinksData = await rinksRes.json()
        setRinks(rinksData.rinks || [])
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.settings) {
          setThresholds({
            coWarning: settingsData.settings.coWarningPpm ?? 20,
            coEvacuation: settingsData.settings.coEvacuationPpm ?? 83,
            no2Warning: settingsData.settings.no2WarningPpm ?? 0.3,
            no2Evacuation: settingsData.settings.no2EvacuationPpm ?? 2.0,
          })
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const response = await fetch(`/api/submissions?moduleType=AIR_QUALITY&limit=50&offset=${submissions.length}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions([...submissions, ...(data.submissions || [])])
        setTotal(data.total || submissions.length + (data.submissions?.length || 0))
      }
    } catch (err) {
      console.error('Error loading more:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleShowMore = () => {
    if (displayCount < submissions.length) {
      setDisplayCount(Math.min(displayCount + PAGE_SIZE, submissions.length))
    } else if (submissions.length < total) {
      loadMore()
    }
  }

  // Find latest reading per rink
  const latestByRink: Record<string, Submission> = {}
  submissions.forEach((s) => {
    if (!latestByRink[s.rinkId]) {
      latestByRink[s.rinkId] = s
    }
  })

  // Check for any alerts
  const alerts = submissions.slice(0, 10).filter((s) => {
    const data = s.data as any
    return (data?.coPpm >= thresholds.coWarning) || (data?.no2Ppm >= thresholds.no2Warning)
  })

  const displayedSubmissions = submissions.slice(0, displayCount)
  const hasMore = displayCount < submissions.length || submissions.length < total

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Air Quality</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor CO and NO2 levels for safety compliance</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/air-quality/new" className="btn btn-primary flex items-center gap-2">
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
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">Air Quality Alert</h3>
              <p className="text-red-700 text-sm">
                {alerts.length} recent reading{alerts.length > 1 ? 's' : ''} exceeded safety thresholds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Levels by Rink */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Levels</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rinks.map((rink) => {
            const latest = latestByRink[rink.id]
            const data = latest?.data as any
            const coStatus = data?.coPpm !== undefined ? getCoStatus(data.coPpm, thresholds.coWarning, thresholds.coEvacuation) : null
            const no2Status = data?.no2Ppm !== undefined ? getNo2Status(data.no2Ppm, thresholds.no2Warning, thresholds.no2Evacuation) : null

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
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{data?.coPpm ?? '--'}</div>
                      <div className="text-xs text-gray-500 mb-1">CO (ppm)</div>
                      {coStatus && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${coStatus.color}`}>
                          {coStatus.label}
                        </span>
                      )}
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{data?.no2Ppm ?? '--'}</div>
                      <div className="text-xs text-gray-500 mb-1">NO2 (ppm)</div>
                      {no2Status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${no2Status.color}`}>
                          {no2Status.label}
                        </span>
                      )}
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

      {/* Thresholds Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Safety Thresholds</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Carbon Monoxide (CO)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Warning Level</span>
                <span className="font-medium text-yellow-600">{thresholds.coWarning} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Evacuation Level</span>
                <span className="font-medium text-red-600">{thresholds.coEvacuation} ppm</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Nitrogen Dioxide (NO2)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Warning Level</span>
                <span className="font-medium text-yellow-600">{thresholds.no2Warning} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Evacuation Level</span>
                <span className="font-medium text-red-600">{thresholds.no2Evacuation} ppm</span>
              </div>
            </div>
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
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">CO (ppm)</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">NO2 (ppm)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubmissions.map((s) => {
                    const data = s.data as any
                    const coStatus = data?.coPpm !== undefined ? getCoStatus(data.coPpm, thresholds.coWarning, thresholds.coEvacuation) : null
                    const no2Status = data?.no2Ppm !== undefined ? getNo2Status(data.no2Ppm, thresholds.no2Warning, thresholds.no2Evacuation) : null
                    const hasAlert = coStatus?.urgent || no2Status?.urgent

                    return (
                      <tr key={s.id} className={`border-b border-gray-100 ${hasAlert ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{new Date(s.submittedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">{s.rink.name}</td>
                        <td className="py-3 px-4 text-right font-mono">{data?.coPpm ?? '--'}</td>
                        <td className="py-3 px-4 text-right font-mono">{data?.no2Ppm ?? '--'}</td>
                        <td className="py-3 px-4">
                          {hasAlert ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Alert</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/dashboard/air-quality/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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
              <div className="text-center pt-4 border-t border-gray-100 mt-4">
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
