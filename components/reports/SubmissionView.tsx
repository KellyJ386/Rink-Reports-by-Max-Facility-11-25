'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormSchema, SubmissionStatus } from '@/types'
import { FormPreview } from '@/components/form-builder'
import { ReportHeader } from './ReportHeader'

interface SubmissionViewProps {
  submission: {
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
      schema: FormSchema
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
  facilityName: string
  canApprove?: boolean
  canEdit?: boolean
  canDelete?: boolean
  baseUrl: string
}

export function SubmissionView({
  submission,
  facilityName,
  canApprove = false,
  canEdit = false,
  canDelete = false,
  baseUrl,
}: SubmissionViewProps) {
  const router = useRouter()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReview = async () => {
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch(`/api/submissions/${submission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to review submission')
      }

      router.refresh()
      setShowReviewModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submission?')) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete submission')
      }

      router.push(baseUrl)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportHeader
        title={submission.formTemplate.name}
        moduleType={submission.formTemplate.moduleType}
        facilityName={facilityName}
        rinkName={submission.rink?.name}
        submittedBy={`${submission.user.firstName} ${submission.user.lastName}`}
        submittedAt={submission.submittedAt || submission.createdAt}
        status={submission.status}
        onBack={() => router.push(baseUrl)}
        actions={
          <div className="flex items-center gap-2">
            {canApprove && submission.status === 'SUBMITTED' && (
              <>
                <button
                  onClick={() => {
                    setReviewAction('approve')
                    setShowReviewModal(true)
                  }}
                  className="btn btn-primary text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setReviewAction('reject')
                    setShowReviewModal(true)
                  }}
                  className="btn btn-danger text-sm"
                >
                  Reject
                </button>
              </>
            )}
            {canEdit && submission.status === 'DRAFT' && (
              <button
                onClick={() => router.push(`${baseUrl}/${submission.id}/edit`)}
                className="btn btn-secondary text-sm"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={processing}
                className="btn btn-secondary text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
        }
      />

      <div className="max-w-4xl mx-auto p-6">
        {/* Review info */}
        {submission.status === 'APPROVED' && submission.reviewer && (
          <div className="card p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Approved</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              By {submission.reviewer.firstName} {submission.reviewer.lastName} on{' '}
              {submission.reviewedAt && new Date(submission.reviewedAt).toLocaleString()}
            </p>
          </div>
        )}

        {submission.status === 'REJECTED' && (
          <div className="card p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">Rejected</span>
            </div>
            {submission.reviewer && (
              <p className="text-sm text-red-600 mt-1">
                By {submission.reviewer.firstName} {submission.reviewer.lastName} on{' '}
                {submission.reviewedAt && new Date(submission.reviewedAt).toLocaleString()}
              </p>
            )}
            {submission.reviewNotes && (
              <p className="text-sm text-red-700 mt-2">
                <strong>Reason:</strong> {submission.reviewNotes}
              </p>
            )}
          </div>
        )}

        {/* Form data */}
        <FormPreview
          schema={submission.formTemplate.schema}
          initialData={submission.data}
          readOnly={true}
        />
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve Report' : 'Reject Report'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {reviewAction === 'approve' ? 'Notes (optional)' : 'Reason for rejection'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Add any notes...'
                    : 'Please provide a reason...'
                }
                rows={3}
                className="input w-full"
                required={reviewAction === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn btn-secondary flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={processing || (reviewAction === 'reject' && !reviewNotes.trim())}
                className={`btn flex-1 ${
                  reviewAction === 'approve' ? 'btn-primary' : 'btn-danger'
                }`}
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
