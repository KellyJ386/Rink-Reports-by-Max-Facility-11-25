'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UniversalHeaderView } from '@/components/reports/UniversalHeader'
import { GRID_CONFIGS, type GridType } from '@/components/form-builder/fields/IceDepthGridField'

interface MeasurementPoint {
  id: string
  x: number
  y: number
  label: string
}

interface IceDepthSubmission {
  id: string
  moduleType: string
  status: string
  submittedAt: string
  reviewedAt?: string
  reviewComments?: string
  facility: { name: string }
  rink: { name: string }
  submittedBy: { firstName: string; lastName: string }
  reviewedBy?: { firstName: string; lastName: string }
  data: {
    gridType?: GridType
    customPoints?: MeasurementPoint[]
    measurements: Record<string, number>
    notes?: string
    outsideTemp?: number
    stats: {
      avg: number
      min: number
      max: number
      count: number
    }
  }
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-100' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  APPROVED: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function IceDepthViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [submission, setSubmission] = useState<IceDepthSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComments, setReviewComments] = useState('')
  const [processing, setProcessing] = useState(false)

  // Mock permission check - in real app, check user roles
  const canReview = true

  useEffect(() => {
    fetchSubmission()
  }, [id])

  const fetchSubmission = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/submissions/${id}`)
      const data = await response.json()

      if (data.success) {
        setSubmission(data.data)
      } else {
        setError(data.error?.message || 'Failed to load submission')
      }
    } catch {
      setError('Failed to load submission')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!reviewComments.trim() && reviewAction === 'reject') {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/submissions/${id}`, {
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
        setError(data.error?.message || 'Failed to update submission')
      }
    } catch {
      setError('Failed to update submission')
    } finally {
      setProcessing(false)
    }
  }

  const getDepthColor = (value: number) => {
    if (value < 0.75) return 'bg-red-500'
    if (value > 1.25) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Get measurement points based on grid type
  const getMeasurementPoints = (): MeasurementPoint[] => {
    if (!submission) return []

    const gridType = submission.data.gridType || '25'

    if (gridType === 'custom') {
      return submission.data.customPoints || []
    }

    return GRID_CONFIGS[gridType]?.points || GRID_CONFIGS['25'].points
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
          <p className="text-red-600">{error || 'Submission not found'}</p>
          <Link href="/dashboard/ice-depth" className="btn btn-secondary mt-4">
            Back to List
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[submission.status] || statusConfig.DRAFT
  const stats = submission.data.stats
  const gridType = submission.data.gridType || '25'
  const gridConfig = GRID_CONFIGS[gridType]
  const measurementPoints = getMeasurementPoints()
  const totalPoints = measurementPoints.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ice-depth" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ice Depth Reading</h1>
            <p className="text-gray-500">
              {submission.facility.name} - {submission.rink.name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {canReview && ['SUBMITTED', 'UNDER_REVIEW'].includes(submission.status) && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setReviewAction('approve')
                setShowReviewModal(true)
              }}
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setReviewAction('reject')
                setShowReviewModal(true)
              }}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Status Banner */}
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

      {/* Review Comments */}
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
          outsideTemp: submission.data.outsideTemp,
          submittedBy: submission.submittedBy,
        }}
      />

      {/* Grid Type Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <div>
            <span className="font-semibold text-blue-900">{gridConfig.label}</span>
            <span className="text-blue-700 ml-2">- {gridConfig.description}</span>
            {gridType === 'custom' && (
              <span className="text-blue-600 ml-2">({totalPoints} custom points)</span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurement Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.avg.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Average (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.min.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Minimum (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.max.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Maximum (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.count}/{totalPoints}</div>
            <div className="text-sm text-gray-500">Points Recorded</div>
          </div>
        </div>
      </div>

      {/* Ice Depth Grid Visualization */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ice Depth Map</h2>
        <div className="relative bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg p-4" style={{ aspectRatio: '2/1' }}>
          {/* Rink outline */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
            {/* Rink border with rounded ends */}
            <rect
              x="4"
              y="4"
              width="192"
              height="92"
              rx="20"
              ry="20"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              opacity="0.4"
            />
            {/* Center line */}
            <line x1="100" y1="4" x2="100" y2="96" stroke="#ef4444" strokeWidth="0.5" opacity="0.4" />
            {/* Center circle */}
            <circle cx="100" cy="50" r="15" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            {/* Blue lines */}
            <line x1="65" y1="4" x2="65" y2="96" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            <line x1="135" y1="4" x2="135" y2="96" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            {/* Goal creases */}
            <path d="M 10 40 Q 20 50 10 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            <path d="M 190 40 Q 180 50 190 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
          </svg>

          {/* Measurement points */}
          {measurementPoints.map((point) => {
            const value = submission.data.measurements[point.id]
            const hasValue = value !== null && value !== undefined

            return (
              <div
                key={point.id}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  hasValue ? `${getDepthColor(value)} text-white` : 'bg-gray-300 text-gray-600'
                }`}
                style={{ left: `${point.x}%`, top: `${point.y}%`, marginLeft: '-20px', marginTop: '-20px' }}
                title={`Point ${point.label}: ${hasValue ? value.toFixed(2) + '"' : 'No value'}`}
              >
                {hasValue ? value.toFixed(1) : point.label}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>&lt; 0.75&quot; (Too thin)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>0.75&quot; - 1.25&quot; (Optimal)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span>&gt; 1.25&quot; (Too thick)</span>
          </div>
        </div>
      </div>

      {/* Measurement Details Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurement Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Point</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depth</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {gridType === 'custom' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {measurementPoints.map((point) => {
                const value = submission.data.measurements[point.id]
                const hasValue = value !== null && value !== undefined

                let statusLabel = 'Not recorded'
                let statusColor = 'text-gray-500'
                if (hasValue) {
                  if (value < 0.75) {
                    statusLabel = 'Too thin'
                    statusColor = 'text-red-600'
                  } else if (value > 1.25) {
                    statusLabel = 'Too thick'
                    statusColor = 'text-yellow-600'
                  } else {
                    statusLabel = 'Optimal'
                    statusColor = 'text-green-600'
                  }
                }

                return (
                  <tr key={point.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      Point {point.label}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {hasValue ? `${value.toFixed(2)}"` : '-'}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${statusColor}`}>
                      {statusLabel}
                    </td>
                    {gridType === 'custom' && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        X: {point.x.toFixed(0)}%, Y: {point.y.toFixed(0)}%
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {submission.data.notes && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-gray-600">{submission.data.notes}</p>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve Reading' : 'Reject Reading'}
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
