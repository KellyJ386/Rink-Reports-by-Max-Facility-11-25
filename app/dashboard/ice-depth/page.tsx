'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  submittedAt: string
  data: any
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
}

interface Rink {
  id: string
  name: string
}

const PAGE_SIZE = 20

export default function IceDepthPage() {
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
        fetch(`/api/submissions?moduleType=ICE_DEPTH&limit=${PAGE_SIZE}&page=${Math.floor(offset / PAGE_SIZE) + 1}`),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()

      // Check permissions
      const permissions = meData.user?.role?.permissions
      if (!permissions?.iceDepth?.access) {
        router.push('/dashboard')
        return
      }

      setCanSubmit(permissions?.iceDepth?.submit || false)

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ice Depth</h1>
          <p className="text-gray-600 text-sm mt-1">Track ice thickness measurements across your rinks</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/ice-depth/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Reading
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Readings</div>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Rinks</div>
          <div className="text-2xl font-semibold">{rinks.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Last Reading</div>
          <div className="text-sm font-medium">
            {submissions.length > 0
              ? new Date(submissions[0].submittedAt).toLocaleString()
              : 'No readings yet'}
          </div>
        </div>
      </div>

      {/* Submissions List */}
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
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📏</div>
            <p className="text-gray-500 mb-4">No ice depth readings yet</p>
            {canSubmit && (
              <Link href="/dashboard/ice-depth/new" className="btn btn-primary">
                Record First Reading
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date/Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rink</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Submitted By</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Avg Depth</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSubmissions.map((submission) => {
                    const data = submission.data as any
                    const measurements = data?.measurements || []
                    const avgDepth = measurements.length > 0
                      ? (measurements.reduce((sum: number, m: any) => sum + (m.value || 0), 0) / measurements.length).toFixed(2)
                      : '--'

                    return (
                      <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {submission.rink?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {submission.submittedBy?.firstName} {submission.submittedBy?.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{avgDepth}</span>
                          <span className="text-gray-400 text-sm ml-1">in</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/dashboard/ice-depth/${submission.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
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
