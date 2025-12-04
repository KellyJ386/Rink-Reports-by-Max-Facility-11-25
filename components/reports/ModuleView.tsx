'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UniversalHeaderView } from './UniversalHeader'

interface Submission {
  id: string
  moduleType: string
  status: string
  submittedAt: string
  reviewedAt?: string
  reviewComments?: string
  facility?: { name: string }
  rink?: { name: string }
  submittedBy?: { firstName: string; lastName: string }
  reviewedBy?: { firstName: string; lastName: string }
  data: Record<string, unknown>
}

interface ModuleViewProps {
  submissionId: string
  title: string
  basePath: string
  renderData?: (data: Record<string, unknown>) => React.ReactNode
  canReview?: boolean
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-100' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  APPROVED: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' },
}

export function ModuleView({
  submissionId,
  title,
  basePath,
  renderData,
  canReview = true,
}: ModuleViewProps) {
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComments, setReviewComments] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchSubmission()
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/submissions/${submissionId}`)
      const data = await response.json()

      if (data.success) {
        setSubmission(data.data)
      } else {
        setError(data.error?.message || 'Failed to load')
      }
    } catch {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!reviewComments.trim() && reviewAction === 'reject') return

    setProcessing(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          comments: reviewComments,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmission(data.data)
        setShowReviewModal(false)
        setReviewComments('')
      } else {
        setError(data.error?.message || 'Failed to update')
      }
    } catch {
      setError('Failed to update')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Not found'}</p>
          <Link href={basePath} className="btn btn-secondary mt-4">
            Back to List
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[submission.status] || statusConfig.DRAFT

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={basePath} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500">
              {submission.facility?.name}
              {submission.rink && ` - ${submission.rink.name}`}
            </p>
          </div>
        </div>

        {canReview && ['SUBMITTED', 'UNDER_REVIEW'].includes(submission.status) && (
          <div className="flex gap-2">
            <button
              onClick={() => { setReviewAction('approve'); setShowReviewModal(true) }}
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => { setReviewAction('reject'); setShowReviewModal(true) }}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Status */}
      <div className={`${status.bg} rounded-lg p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${status.color}`}>{status.label}</span>
          {submission.reviewedAt && (
            <span className="text-sm text-gray-600">
              • Reviewed by {submission.reviewedBy?.firstName} {submission.reviewedBy?.lastName} on{' '}
              {new Date(submission.reviewedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {submission.reviewComments && (
        <div className={`p-4 rounded-lg border ${
          submission.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-gray-50'
        }`}>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Review Comments</h3>
          <p className="text-sm text-gray-600">{submission.reviewComments}</p>
        </div>
      )}

      {/* Header Info */}
      <UniversalHeaderView
        data={{
          facility: submission.facility,
          rink: submission.rink,
          submittedAt: submission.submittedAt,
          outsideTemp: submission.data?.outsideTemp as number | undefined,
          submittedBy: submission.submittedBy,
        }}
      />

      {/* Data */}
      {renderData ? (
        renderData(submission.data)
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <dl className="space-y-3">
            {Object.entries(submission.data)
              .filter(([key]) => !['outsideTemp'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 sm:w-1/3">
                    {formatLabel(key)}
                  </dt>
                  <dd className="text-sm text-gray-900 sm:w-2/3">
                    {formatValue(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve Submission' : 'Reject Submission'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments {reviewAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className="input w-full"
                placeholder={reviewAction === 'approve' ? 'Optional comments...' : 'Reason for rejection...'}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReviewModal(false)} className="btn btn-secondary" disabled={processing}>
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={processing || (reviewAction === 'reject' && !reviewComments.trim())}
                className={`btn ${reviewAction === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
              >
                {processing ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, ' ')
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}
