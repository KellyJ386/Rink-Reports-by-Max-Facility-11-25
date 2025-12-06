'use client'

import { useState, useEffect } from 'react'

interface TimeOffRequest {
  id: string
  startDate: string
  endDate: string
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED'
  reviewNotes: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: '✅' },
  DENIED: { label: 'Denied', color: 'bg-red-100 text-red-800', icon: '❌' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '🚫' }
}

export default function TimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [canApprove, setCanApprove] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  // Review modal state
  const [reviewRequest, setReviewRequest] = useState<TimeOffRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/schedule/time-off')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
        setCanApprove(data.canApprove || false)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!startDate || !endDate) {
      setError('Please select start and end dates')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit request')
        return
      }

      setShowForm(false)
      setStartDate('')
      setEndDate('')
      setReason('')
      fetchRequests()
    } catch (error) {
      setError('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async (status: 'APPROVED' | 'DENIED') => {
    if (!reviewRequest) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule/time-off', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewRequest.id,
          status,
          reviewNotes
        })
      })

      if (res.ok) {
        setReviewRequest(null)
        setReviewNotes('')
        fetchRequests()
      }
    } catch (error) {
      console.error('Failed to review request:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      const res = await fetch('/api/schedule/time-off', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'CANCELLED' })
      })

      if (res.ok) {
        fetchRequests()
      }
    } catch (error) {
      console.error('Failed to cancel request:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDayCount = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Time Off Requests</h2>
          <p className="text-sm text-gray-500">Request and manage time off</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Request Time Off
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Your Requests</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No time-off requests yet. Click &quot;Request Time Off&quot; to submit one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => {
              const status = STATUS_CONFIG[req.status]
              const days = getDayCount(req.startDate, req.endDate)

              return (
                <div key={req.id} className="px-4 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{status.icon}</div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDate(req.startDate)} - {formatDate(req.endDate)}
                          <span className="ml-2 text-sm text-gray-500">
                            ({days} day{days !== 1 ? 's' : ''})
                          </span>
                        </div>
                        {canApprove && (
                          <div className="text-sm text-gray-600">
                            {req.user.firstName} {req.user.lastName}
                          </div>
                        )}
                        {req.reason && (
                          <div className="text-sm text-gray-500 mt-1">
                            Reason: {req.reason}
                          </div>
                        )}
                        {req.reviewNotes && (
                          <div className="text-sm text-gray-500 mt-1 italic">
                            Note: {req.reviewNotes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {req.status === 'PENDING' && (
                        <>
                          {canApprove ? (
                            <button
                              onClick={() => {
                                setReviewRequest(req)
                                setReviewNotes('')
                              }}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              Review
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCancel(req.id)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Request Time Off</h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={today}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {startDate && endDate && (
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                  Requesting {getDayCount(startDate, endDate)} day(s) off
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Vacation, personal day, appointment, etc."
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Review Time Off Request</h2>
              <button
                onClick={() => setReviewRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">
                  {reviewRequest.user.firstName} {reviewRequest.user.lastName}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {formatDate(reviewRequest.startDate)} - {formatDate(reviewRequest.endDate)}
                  <span className="ml-2">
                    ({getDayCount(reviewRequest.startDate, reviewRequest.endDate)} days)
                  </span>
                </div>
                {reviewRequest.reason && (
                  <div className="text-sm text-gray-500 mt-2">
                    Reason: {reviewRequest.reason}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Add a note for the employee..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('DENIED')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  Deny
                </button>
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
