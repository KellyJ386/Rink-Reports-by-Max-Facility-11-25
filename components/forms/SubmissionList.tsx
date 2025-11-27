'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Submission {
  id: string
  submittedAt: string
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  outsideTemp?: number
  outsideTempUnit: string
  formTemplate: {
    id: string
    name: string
    moduleType: string
  }
  rink: {
    id: string
    name: string
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
  }
}

interface SubmissionListProps {
  moduleType: string
  modulePath: string
  onNewSubmission?: () => void
  showRinkFilter?: boolean
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
  PENDING_REVIEW: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
}

export default function SubmissionList({
  moduleType,
  modulePath,
  onNewSubmission,
  showRinkFilter = true,
}: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [rinkFilter, setRinkFilter] = useState<string>('')
  const [rinks, setRinks] = useState<Array<{ id: string; name: string }>>([])

  // Pagination
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchSubmissions()
  }, [moduleType, statusFilter, rinkFilter, page])

  useEffect(() => {
    // Fetch rinks for filter
    if (showRinkFilter) {
      fetchRinks()
    }
  }, [showRinkFilter])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        moduleType,
        limit: String(limit),
        offset: String(page * limit),
      })

      if (statusFilter) params.append('status', statusFilter)
      if (rinkFilter) params.append('rinkId', rinkFilter)

      const response = await fetch(`/api/submissions?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch submissions')
      }

      setSubmissions(data.submissions)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/rinks')
      const data = await response.json()
      if (response.ok && data.rinks) {
        setRinks(data.rinks)
      }
    } catch (err) {
      console.error('Failed to fetch rinks:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return
    }

    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      fetchSubmissions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            className="input text-sm"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {showRinkFilter && rinks.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rink:</label>
            <select
              value={rinkFilter}
              onChange={(e) => { setRinkFilter(e.target.value); setPage(0) }}
              className="input text-sm"
            >
              <option value="">All Rinks</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>
                  {rink.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1" />

        {onNewSubmission && (
          <button onClick={onNewSubmission} className="btn btn-primary">
            + New Entry
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && submissions.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No submissions yet
          </h3>
          <p className="text-gray-600 mb-4">
            {statusFilter || rinkFilter
              ? 'No submissions match your filters'
              : 'Create your first submission to get started'}
          </p>
          {onNewSubmission && !statusFilter && !rinkFilter && (
            <button onClick={onNewSubmission} className="btn btn-primary">
              Create Submission
            </button>
          )}
        </div>
      )}

      {/* Submissions Table */}
      {!isLoading && submissions.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                {showRinkFilter && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rink
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => {
                const statusBadge = STATUS_BADGES[submission.status] || STATUS_BADGES.SUBMITTED

                return (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(submission.submittedAt)}
                      {submission.outsideTemp !== undefined && (
                        <span className="ml-2 text-gray-500 text-xs">
                          ({submission.outsideTemp}°{submission.outsideTempUnit})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {submission.formTemplate.name}
                    </td>
                    {showRinkFilter && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {submission.rink.name}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/${modulePath}/${submission.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                        {submission.status === 'DRAFT' && (
                          <>
                            <Link
                              href={`/dashboard/${modulePath}/${submission.id}/edit`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(submission.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn btn-secondary text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn btn-secondary text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
