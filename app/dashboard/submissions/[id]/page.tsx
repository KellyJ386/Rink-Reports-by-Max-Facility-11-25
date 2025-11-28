'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FieldRenderer } from '@/components/form-builder/fields'
import type { FormSchema, FormSubmission, SubmissionStatus } from '@/types/form-builder'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

interface SubmissionDetail extends FormSubmission {
  templateSchema: FormSchema
  templateVersion: number
  submittedVersion: number
  submittedByEmail?: string
}

export default function SubmissionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const fetchSubmission = useCallback(async () => {
    try {
      const [submissionRes, meRes] = await Promise.all([
        fetch(`/api/submissions/${id}`),
        fetch('/api/auth/me'),
      ])

      if (!submissionRes.ok) throw new Error('Failed to fetch submission')

      const submissionData = await submissionRes.json()
      setSubmission(submissionData.submission)
      setReviewNotes(submissionData.submission.reviewNotes || '')

      if (meRes.ok) {
        const meData = await meRes.json()
        // Check if user has admin access
        setIsAdmin(meData.user?.role?.name === 'Admin' || meData.user?.role?.name === 'Manager')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  const handleStatusUpdate = async (newStatus: SubmissionStatus) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes,
        }),
      })

      if (!res.ok) throw new Error('Failed to update submission')

      // Refresh data
      await fetchSubmission()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading submission...</div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Submission not found'}
        </div>
      </div>
    )
  }

  const schema = submission.templateSchema

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/submissions"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Submissions
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{submission.templateName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                  STATUS_COLORS[submission.status]
                }`}
              >
                {submission.status}
              </span>
              {submission.submittedVersion !== submission.templateVersion && (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Form updated since submission (v{submission.submittedVersion} vs v{submission.templateVersion})
                </span>
              )}
            </div>
          </div>

          {submission.status === 'draft' && (
            <button
              onClick={() => router.push(`/dashboard/forms/${submission.templateId}/fill?draft=${id}`)}
              className="btn btn-primary"
            >
              Continue Editing
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Submitted By</span>
            <span className="font-medium text-gray-900">{submission.submittedByName}</span>
            {submission.submittedByEmail && (
              <span className="text-gray-500 block text-xs">{submission.submittedByEmail}</span>
            )}
          </div>
          <div>
            <span className="text-gray-500 block">Submitted At</span>
            <span className="font-medium text-gray-900">{formatDate(submission.submittedAt)}</span>
          </div>
          {submission.rinkName && (
            <div>
              <span className="text-gray-500 block">Rink</span>
              <span className="font-medium text-gray-900">{submission.rinkName}</span>
            </div>
          )}
          {submission.reviewedByName && (
            <div>
              <span className="text-gray-500 block">Reviewed By</span>
              <span className="font-medium text-gray-900">{submission.reviewedByName}</span>
              {submission.reviewedAt && (
                <span className="text-gray-500 block text-xs">
                  {formatDate(submission.reviewedAt)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Data Display */}
      {schema?.sections?.map((section) => (
        <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          {section.title && (
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h2>
          )}

          <div className="space-y-4">
            {section.fields
              .filter((f) => !['heading', 'paragraph', 'divider'].includes(f.type))
              .map((field) => (
                <div key={field.id}>
                  <FieldRenderer
                    field={field}
                    value={submission.data[field.name]}
                    onChange={() => {}} // Read-only
                    disabled={true}
                    formData={submission.data}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Admin Review Section */}
      {isAdmin && submission.status !== 'draft' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Notes
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="input"
              rows={3}
              placeholder="Add any notes about this submission..."
            />
          </div>

          <div className="flex items-center gap-3">
            {submission.status === 'submitted' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('reviewed')}
                  disabled={updating}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Reviewed'}
                </button>
              </>
            )}

            {['reviewed', 'approved', 'rejected'].includes(submission.status) && (
              <button
                onClick={() => handleStatusUpdate('submitted')}
                disabled={updating}
                className="btn btn-secondary disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Reset to Submitted'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review Notes Display (for non-admins) */}
      {!isAdmin && submission.reviewNotes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Review Notes</h3>
          <p className="text-gray-600">{submission.reviewNotes}</p>
        </div>
      )}
    </div>
  )
}
