'use client'

import { useState } from 'react'
import { UniversalHeaderView } from './UniversalHeader'
import { FormView } from '@/components/forms/FormRenderer'
import type { FormSchema } from '@/components/form-builder/types'

type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

interface Submission {
  id: string
  moduleType: string
  status: SubmissionStatus
  data: Record<string, unknown>
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: {
    firstName: string
    lastName: string
  }
  reviewComments?: string
  facility?: {
    name: string
  }
  rink?: {
    name: string
  }
  submittedBy?: {
    firstName: string
    lastName: string
  }
  formTemplate?: {
    schema: FormSchema
  }
  attachments?: {
    id: string
    fileName: string
    fileType: string
    fileUrl: string
    createdAt: string
  }[]
  auditLogs?: {
    id: string
    action: string
    performedBy: {
      firstName: string
      lastName: string
    }
    performedAt: string
    details?: string
  }[]
}

interface SubmissionViewProps {
  submission: Submission
  onApprove?: (comments: string) => Promise<void>
  onReject?: (comments: string) => Promise<void>
  onEdit?: () => void
  canReview?: boolean
  canEdit?: boolean
}

const statusConfig: Record<SubmissionStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-100' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  APPROVED: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' },
  ARCHIVED: { label: 'Archived', color: 'text-gray-500', bg: 'bg-gray-100' },
}

export function SubmissionView({
  submission,
  onApprove,
  onReject,
  onEdit,
  canReview = false,
  canEdit = false,
}: SubmissionViewProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComments, setReviewComments] = useState('')
  const [processing, setProcessing] = useState(false)

  const status = statusConfig[submission.status] || statusConfig.DRAFT

  const handleReview = async () => {
    if (!reviewComments.trim() && reviewAction === 'reject') {
      return // Require comments for rejection
    }

    setProcessing(true)
    try {
      if (reviewAction === 'approve' && onApprove) {
        await onApprove(reviewComments)
      } else if (reviewAction === 'reject' && onReject) {
        await onReject(reviewComments)
      }
      setShowReviewModal(false)
      setReviewComments('')
    } finally {
      setProcessing(false)
    }
  }

  const openReviewModal = (action: 'approve' | 'reject') => {
    setReviewAction(action)
    setReviewComments('')
    setShowReviewModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`${status.bg} rounded-lg p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <StatusIcon status={submission.status} />
          <div>
            <span className={`font-semibold ${status.color}`}>{status.label}</span>
            {submission.reviewedAt && (
              <p className="text-sm text-gray-600">
                {submission.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by{' '}
                {submission.reviewedBy?.firstName} {submission.reviewedBy?.lastName} on{' '}
                {new Date(submission.reviewedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && submission.status === 'DRAFT' && onEdit && (
            <button onClick={onEdit} className="btn btn-secondary">
              Edit
            </button>
          )}
          {canReview && ['SUBMITTED', 'UNDER_REVIEW'].includes(submission.status) && (
            <>
              {onApprove && (
                <button
                  onClick={() => openReviewModal('approve')}
                  className="btn bg-green-600 text-white hover:bg-green-700"
                >
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => openReviewModal('reject')}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  Reject
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Review Comments (if any) */}
      {submission.reviewComments && (
        <div className={`p-4 rounded-lg border ${
          submission.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
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
          outsideTemp: submission.data.outsideTemp as number | undefined,
          submittedBy: submission.submittedBy,
        }}
      />

      {/* Form Data */}
      {submission.formTemplate?.schema && (
        <FormView schema={submission.formTemplate.schema} values={submission.data} />
      )}

      {/* Raw Data Display (if no schema) */}
      {!submission.formTemplate?.schema && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Data</h3>
          <dl className="space-y-3">
            {Object.entries(submission.data).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="text-sm font-medium text-gray-500 sm:w-1/3">{formatLabel(key)}</dt>
                <dd className="text-sm text-gray-900 sm:w-2/3">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Attachments */}
      {submission.attachments && submission.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {submission.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileIcon type={attachment.fileType} />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(attachment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {submission.auditLogs && submission.auditLogs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
          <div className="space-y-4">
            {submission.auditLogs.map((log, index) => (
              <div key={log.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ActivityIcon action={log.action} />
                  </div>
                  {index < submission.auditLogs!.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {formatAction(log.action)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.performedBy.firstName} {log.performedBy.lastName} •{' '}
                    {new Date(log.performedAt).toLocaleString()}
                  </p>
                  {log.details && (
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                placeholder={
                  reviewAction === 'approve'
                    ? 'Optional comments...'
                    : 'Please provide a reason for rejection...'
                }
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn btn-secondary"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={processing || (reviewAction === 'reject' && !reviewComments.trim())}
                className={`btn ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
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

// Helper components
function StatusIcon({ status }: { status: SubmissionStatus }) {
  switch (status) {
    case 'APPROVED':
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'REJECTED':
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'UNDER_REVIEW':
      return (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'SUBMITTED':
      return (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    default:
      return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) {
    return (
      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
  if (type === 'application/pdf') {
    return (
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
  return (
    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function ActivityIcon({ action }: { action: string }) {
  switch (action.toLowerCase()) {
    case 'created':
      return <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
    case 'submitted':
      return <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
    case 'approved':
      return <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
    case 'rejected':
      return <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
    default:
      return <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
  }
}

function formatAction(action: string): string {
  const actions: Record<string, string> = {
    created: 'Submission created',
    submitted: 'Submission submitted',
    approved: 'Submission approved',
    rejected: 'Submission rejected',
    updated: 'Submission updated',
    reviewed: 'Review started',
  }
  return actions[action.toLowerCase()] || action
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
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
