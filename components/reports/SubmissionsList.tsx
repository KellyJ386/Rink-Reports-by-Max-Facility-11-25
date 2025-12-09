'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SubmissionStatus } from '@/types'

interface Submission {
  id: string
  status: SubmissionStatus
  data: Record<string, unknown>
  createdAt: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  formTemplate: {
    id: string
    name: string
    moduleType: string
  }
  user: {
    id: string
    firstName: string
    lastName: string
  }
  rink?: {
    id: string
    name: string
  } | null
  reviewer?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface SubmissionsListProps {
  moduleType?: string
  formTemplateId?: string
  baseUrl: string // e.g., '/dashboard/ice-depth'
  title?: string
  showNewButton?: boolean
  newButtonUrl?: string
}

const statusStyles: Record<SubmissionStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  ARCHIVED: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Archived' },
}

export function SubmissionsList({
  moduleType,
  formTemplateId,
  baseUrl,
  title,
  showNewButton = true,
  newButtonUrl,
}: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchSubmissions()
  }, [moduleType, formTemplateId])

  const fetchSubmissions = async () => {
    try {
      const params = new URLSearchParams()
      if (moduleType) params.set('moduleType', moduleType)
      if (formTemplateId) params.set('formTemplateId', formTemplateId)

      const res = await fetch(`/api/submissions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch submissions')

      const data = await res.json()
      setSubmissions(data.submissions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter === 'all') return true
    return s.status === statusFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-8 text-center text-red-600">
        <p>{error}</p>
        <button onClick={fetchSubmissions} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title || 'Submissions'}</h2>
        {showNewButton && (
          <Link
            href={newButtonUrl || `${baseUrl}/new`}
            className="btn btn-primary"
          >
            + New Report
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const).map((status) => {
          const count = status === 'all'
            ? submissions.length
            : submissions.filter((s) => s.status === status).length
          const style = status === 'all'
            ? { bg: 'bg-gray-100', text: 'text-gray-700' }
            : statusStyles[status]

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : `${style.bg} ${style.text} hover:opacity-80`
              }`}
            >
              {status === 'all' ? 'All' : statusStyles[status].label} ({count})
            </button>
          )
        })}
      </div>

      {/* List */}
      {filteredSubmissions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900">No submissions yet</h3>
          <p className="text-gray-600 mt-2 mb-6">
            Create your first report to get started
          </p>
          {showNewButton && (
            <Link
              href={newButtonUrl || `${baseUrl}/new`}
              className="btn btn-primary"
            >
              Create Report
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => {
            const statusConfig = statusStyles[submission.status]
            return (
              <Link
                key={submission.id}
                href={`${baseUrl}/${submission.id}`}
                className="card p-4 block hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {submission.formTemplate.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                      {submission.rink && (
                        <span className="text-xs text-gray-500">
                          {submission.rink.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>
                        by {submission.user.firstName} {submission.user.lastName}
                      </span>
                      <span>
                        {formatDate(submission.submittedAt || submission.createdAt)}
                      </span>
                    </div>
                    {submission.status === 'REJECTED' && submission.reviewNotes && (
                      <p className="mt-2 text-sm text-red-600">
                        Rejection reason: {submission.reviewNotes}
                      </p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
