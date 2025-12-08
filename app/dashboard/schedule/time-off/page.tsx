'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TimeOffRequest {
  id: string
  userId: string
  requestType: string
  startDate: string
  endDate: string
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED'
  reviewNotes: string | null
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface UserPermissions {
  access: boolean
  viewOwn: boolean
  viewAll: boolean
  create: boolean
  publish: boolean
}

const REQUEST_TYPES = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Day' },
  { value: 'BEREAVEMENT', label: 'Bereavement' },
  { value: 'JURY_DUTY', label: 'Jury Duty' },
  { value: 'OTHER', label: 'Other' },
]

export default function TimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')

  // Form state
  const [requestType, setRequestType] = useState('VACATION')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchRequests()
  }, [filter])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setPermissions(data.user.permissions.schedule)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'pending') params.set('pending', 'true')
      else if (filter !== 'all') params.set('status', filter.toUpperCase())

      const res = await fetch(`/api/time-off?${params}`)
      const data = await res.json()

      if (res.ok) {
        setRequests(data.requests || [])
      } else {
        setError(data.error || 'Failed to load requests')
      }
    } catch (err) {
      setError('Failed to load time-off requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          startDate,
          endDate,
          reason: reason || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setShowModal(false)
        setRequestType('VACATION')
        setStartDate('')
        setEndDate('')
        setReason('')
        await fetchRequests()
      } else {
        setError(data.error || 'Failed to submit request')
      }
    } catch (err) {
      setError('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this time-off request?')) return

    try {
      const res = await fetch(`/api/time-off/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (res.ok) {
        await fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to approve')
      }
    } catch (err) {
      alert('Failed to approve request')
    }
  }

  const handleDeny = async (id: string) => {
    const notes = prompt('Reason for denial (optional):')

    try {
      const res = await fetch(`/api/time-off/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DENIED',
          reviewNotes: notes || null,
        }),
      })

      if (res.ok) {
        await fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to deny')
      }
    } catch (err) {
      alert('Failed to deny request')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this time-off request?')) return

    try {
      const res = await fetch(`/api/time-off/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchRequests()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel')
      }
    } catch (err) {
      alert('Failed to cancel request')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      DENIED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`
  }

  const getRequestTypeLabel = (type: string) => {
    const found = REQUEST_TYPES.find(t => t.value === type)
    return found ? found.label : type
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading && !requests.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading time-off requests...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-600">Request and manage time off</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/schedule/availability"
            className="btn-secondary"
          >
            My Availability
          </Link>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Request Time Off
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'denied'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="card">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No time-off requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  {permissions?.viewAll && <th className="pb-3 font-medium">Employee</th>}
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Dates</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id} className="border-b last:border-0">
                    {permissions?.viewAll && (
                      <td className="py-4">
                        {request.user
                          ? `${request.user.firstName} ${request.user.lastName}`
                          : 'Unknown'}
                      </td>
                    )}
                    <td className="py-4">{getRequestTypeLabel(request.requestType)}</td>
                    <td className="py-4">
                      {formatDate(request.startDate)}
                      {request.startDate !== request.endDate && (
                        <> - {formatDate(request.endDate)}</>
                      )}
                    </td>
                    <td className="py-4 max-w-xs truncate">
                      {request.reason || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-4">
                      <span className={getStatusBadge(request.status)}>
                        {request.status}
                      </span>
                      {request.reviewNotes && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note: {request.reviewNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        {request.status === 'PENDING' && permissions?.create && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeny(request.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {request.status === 'PENDING' && !permissions?.create && (
                          <button
                            onClick={() => handleCancel(request.id)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                        {request.status === 'APPROVED' && (
                          <button
                            onClick={() => handleCancel(request.id)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Request Time Off</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Leave
                  </label>
                  <select
                    value={requestType}
                    onChange={e => setRequestType(e.target.value)}
                    className="input"
                    required
                  >
                    {REQUEST_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="input"
                      min={startDate}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Optional notes for your request"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
