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

const CHECKLIST_TYPES = {
  opening: { label: 'Opening', icon: '🌅', color: 'bg-yellow-100 text-yellow-800' },
  closing: { label: 'Closing', icon: '🌙', color: 'bg-indigo-100 text-indigo-800' },
  safety: { label: 'Safety', icon: '🛡️', color: 'bg-red-100 text-red-800' },
  equipment: { label: 'Equipment', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
  maintenance: { label: 'Maintenance', icon: '🔨', color: 'bg-orange-100 text-orange-800' },
}

function getCompletionStatus(completed: number, total: number) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  if (percentage === 100) return { label: 'Complete', color: 'bg-green-100 text-green-800' }
  if (percentage >= 50) return { label: `${percentage}%`, color: 'bg-yellow-100 text-yellow-800' }
  return { label: `${percentage}%`, color: 'bg-red-100 text-red-800' }
}

const PAGE_SIZE = 20

export default function ChecklistsPage() {
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
        fetch(`/api/submissions?moduleType=DAILY_CHECKLIST&limit=${PAGE_SIZE}&page=${Math.floor(offset / PAGE_SIZE) + 1}`),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()

      // Check permissions
      const permissions = meData.user?.role?.permissions
      if (!permissions?.dailyChecklist?.access) {
        router.push('/dashboard')
        return
      }

      setCanSubmit(permissions?.dailyChecklist?.submit || false)

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

  // Get today's checklists
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayChecklists = submissions.filter((s) => {
    const submitted = new Date(s.submittedAt)
    submitted.setHours(0, 0, 0, 0)
    return submitted.getTime() === today.getTime()
  })

  // Calculate stats
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const stats = {
    todayTotal: todayChecklists.length,
    todayComplete: todayChecklists.filter((s) => {
      const data = s.data as any
      return data?.allItemsChecked || data?.completionPercentage === 100
    }).length,
    weekTotal: submissions.filter((s) => {
      const submitted = new Date(s.submittedAt)
      return submitted >= weekAgo
    }).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Checklists</h1>
          <p className="text-gray-600 text-sm mt-1">Track daily operations and safety checks</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/checklists/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Checklist
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.todayTotal}</div>
          <div className="text-sm text-gray-500">Today's Checklists</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.todayComplete}</div>
          <div className="text-sm text-gray-500">Completed Today</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.weekTotal}</div>
          <div className="text-sm text-gray-500">This Week</div>
        </div>
      </div>

      {/* Quick Start Buttons */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CHECKLIST_TYPES).map(([key, type]) => (
            <Link
              key={key}
              href={`/dashboard/checklists/new?type=${key}`}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg ${type.color} hover:opacity-80 transition-opacity`}
            >
              <span className="text-xl">{type.icon}</span>
              <span className="font-medium">{type.label} Checklist</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress by Rink</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rinks.map((rink) => {
            const rinkChecklists = todayChecklists.filter((c) => c.rinkId === rink.id)
            const hasOpening = rinkChecklists.some((c) => (c.data as any)?.checklistType === 'opening')
            const hasClosing = rinkChecklists.some((c) => (c.data as any)?.checklistType === 'closing')
            const hasSafety = rinkChecklists.some((c) => (c.data as any)?.checklistType === 'safety')

            return (
              <div key={rink.id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">{rink.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Opening</span>
                    {hasOpening ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Safety</span>
                    {hasSafety ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Closing</span>
                    {hasClosing ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Checklists */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Checklists</h2>
          {total > 0 && (
            <span className="text-sm text-gray-500">
              Showing {displayedSubmissions.length} of {total}
            </span>
          )}
        </div>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No checklists completed yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rink</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Completed By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubmissions.map((s) => {
                    const data = s.data as any
                    const type = CHECKLIST_TYPES[data?.checklistType as keyof typeof CHECKLIST_TYPES] || {
                      label: 'General',
                      icon: '📋',
                      color: 'bg-gray-100 text-gray-800',
                    }
                    const completed = data?.completedItems || 0
                    const totalItems = data?.totalItems || 0
                    const status = getCompletionStatus(completed, totalItems)

                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{new Date(s.submittedAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${type.color}`}>
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{s.rink?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-sm">
                          {s.submittedBy?.firstName} {s.submittedBy?.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/dashboard/checklists/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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
