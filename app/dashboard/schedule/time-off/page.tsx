'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

interface TimeOffRequest {
  id: string
  userId: string
  startDate: string
  endDate: string
  requestType: string
  reason: string | null
  status: string
  hoursRequested: number | null
  hoursPaid: number | null
  reviewNotes: string | null
  reviewedAt: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role?: { name: string }
  }
  reviewedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

const TIME_OFF_TYPES = [
  { value: 'VACATION', label: 'Vacation', color: 'bg-blue-100 text-blue-700' },
  { value: 'SICK', label: 'Sick', color: 'bg-red-100 text-red-700' },
  { value: 'PERSONAL', label: 'Personal', color: 'bg-purple-100 text-purple-700' },
  { value: 'BEREAVEMENT', label: 'Bereavement', color: 'bg-gray-100 text-gray-700' },
  { value: 'JURY_DUTY', label: 'Jury Duty', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'UNPAID', label: 'Unpaid', color: 'bg-orange-100 text-orange-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-100 text-gray-600' },
]

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  DENIED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function TimeOffPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [canApprove, setCanApprove] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    requestType: 'VACATION',
    reason: '',
    hoursRequested: '',
  })

  const [reviewData, setReviewData] = useState({
    status: 'APPROVED',
    reviewNotes: '',
    hoursPaid: '',
  })

  useEffect(() => {
    fetchRequests()
    checkPermissions()
  }, [filterStatus])

  async function checkPermissions() {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const { permissions } = await response.json()
        setCanApprove(permissions?.schedule?.approve === true)
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  async function fetchRequests() {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/schedule/time-off?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch('/api/schedule/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          requestType: formData.requestType,
          reason: formData.reason || null,
          hoursRequested: formData.hoursRequested ? parseFloat(formData.hoursRequested) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to submit request')
        return
      }

      setShowNewModal(false)
      setFormData({
        startDate: '',
        endDate: '',
        requestType: 'VACATION',
        reason: '',
        hoursRequested: '',
      })
      fetchRequests()
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/schedule/time-off/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewData.status,
          reviewNotes: reviewData.reviewNotes || null,
          hoursPaid: reviewData.hoursPaid ? parseFloat(reviewData.hoursPaid) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to review request')
        return
      }

      setShowReviewModal(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (error) {
      console.error('Error reviewing request:', error)
      alert('Failed to review request')
    }
  }

  async function handleCancel(requestId: string) {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      const response = await fetch(`/api/schedule/time-off/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to cancel request')
        return
      }

      fetchRequests()
    } catch (error) {
      console.error('Error cancelling request:', error)
    }
  }

  const getTypeStyle = (type: string) => {
    return TIME_OFF_TYPES.find((t) => t.value === type)?.color || 'bg-gray-100 text-gray-600'
  }

  const getTypeLabel = (type: string) => {
    return TIME_OFF_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time-Off Requests</h1>
          <p className="text-gray-600 mt-1">
            Submit and manage time-off requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/schedule" className="btn btn-secondary">
            &larr; Back to Schedule
          </Link>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary"
          >
            + Request Time Off
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="DENIED">Denied</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No time-off requests found
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-sm ${getTypeStyle(request.requestType)}`}>
                      {getTypeLabel(request.requestType)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-sm ${STATUS_STYLES[request.status]}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="font-medium">
                    {request.user.firstName} {request.user.lastName}
                    {request.user.role && (
                      <span className="text-gray-500 font-normal ml-2">
                        ({request.user.role.name})
                      </span>
                    )}
                  </div>

                  <div className="text-gray-600 mt-1">
                    {format(parseISO(request.startDate), 'MMM d, yyyy')} -{' '}
                    {format(parseISO(request.endDate), 'MMM d, yyyy')}
                  </div>

                  {request.reason && (
                    <div className="text-gray-500 text-sm mt-2">
                      Reason: {request.reason}
                    </div>
                  )}

                  {request.reviewNotes && (
                    <div className="text-gray-500 text-sm mt-1">
                      Review notes: {request.reviewNotes}
                    </div>
                  )}

                  {request.reviewedBy && (
                    <div className="text-gray-400 text-xs mt-2">
                      Reviewed by {request.reviewedBy.firstName} {request.reviewedBy.lastName}{' '}
                      {request.reviewedAt && `on ${format(parseISO(request.reviewedAt), 'MMM d, yyyy')}`}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {request.status === 'PENDING' && canApprove && (
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setReviewData({
                          status: 'APPROVED',
                          reviewNotes: '',
                          hoursPaid: request.hoursRequested?.toString() || '',
                        })
                        setShowReviewModal(true)
                      }}
                      className="btn btn-primary text-sm"
                    >
                      Review
                    </button>
                  )}
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Request Time Off</h2>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requestType: e.target.value }))}
                  className="input w-full"
                  required
                >
                  {TIME_OFF_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Requested (optional)
                </label>
                <input
                  type="number"
                  value={formData.hoursRequested}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hoursRequested: e.target.value }))}
                  className="input w-full"
                  step="0.5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Review Time-Off Request</h2>
            </div>

            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">
                  {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {format(parseISO(selectedRequest.startDate), 'MMM d')} -{' '}
                  {format(parseISO(selectedRequest.endDate), 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {getTypeLabel(selectedRequest.requestType)}
                </div>
                {selectedRequest.reason && (
                  <div className="text-sm text-gray-500 mt-1">
                    Reason: {selectedRequest.reason}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData((prev) => ({ ...prev, status: e.target.value }))}
                  className="input w-full"
                  required
                >
                  <option value="APPROVED">Approve</option>
                  <option value="DENIED">Deny</option>
                </select>
              </div>

              {reviewData.status === 'APPROVED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Paid (optional)
                  </label>
                  <input
                    type="number"
                    value={reviewData.hoursPaid}
                    onChange={(e) => setReviewData((prev) => ({ ...prev, hoursPaid: e.target.value }))}
                    className="input w-full"
                    step="0.5"
                    min="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={reviewData.reviewNotes}
                  onChange={(e) => setReviewData((prev) => ({ ...prev, reviewNotes: e.target.value }))}
                  className="input w-full"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedRequest(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${reviewData.status === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`}
                >
                  {reviewData.status === 'APPROVED' ? 'Approve' : 'Deny'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
