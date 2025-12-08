'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

interface ShiftSwapRequest {
  id: string
  requesterId: string
  swapType: 'SWAP' | 'GIVEAWAY' | 'PICKUP'
  reason: string | null
  status: string
  peerApprovedAt: string | null
  managerApprovedAt: string | null
  managerNotes: string | null
  createdAt: string
  requester: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  targetUser?: {
    id: string
    firstName: string
    lastName: string
  } | null
  originalShift: {
    id: string
    date: string
    startTime: string
    endTime: string
    shift?: { name: string } | null
  }
  targetShift?: {
    id: string
    date: string
    startTime: string
    endTime: string
    shift?: { name: string } | null
  } | null
  managerApprovedBy?: {
    firstName: string
    lastName: string
  } | null
}

const SWAP_TYPE_LABELS = {
  SWAP: 'Shift Swap',
  GIVEAWAY: 'Give Away',
  PICKUP: 'Pickup',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_PEER: 'bg-yellow-100 text-yellow-700',
  PENDING_MANAGER: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  DENIED_PEER: 'bg-red-100 text-red-700',
  DENIED_MANAGER: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PEER: 'Waiting for Response',
  PENDING_MANAGER: 'Pending Approval',
  APPROVED: 'Approved',
  DENIED_PEER: 'Declined by Peer',
  DENIED_MANAGER: 'Denied by Manager',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export default function SwapsPage() {
  const [requests, setRequests] = useState<ShiftSwapRequest[]>([])
  const [pendingForMe, setPendingForMe] = useState<ShiftSwapRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [canApprove, setCanApprove] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    fetchData()
    checkPermissions()
  }, [filterStatus])

  async function checkPermissions() {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const { user, permissions } = await response.json()
        setCanApprove(permissions?.schedule?.approve === true)
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  async function fetchData() {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const [allResponse, pendingResponse] = await Promise.all([
        fetch(`/api/schedule/swap?${params}`),
        fetch('/api/schedule/swap?pendingForMe=true'),
      ])

      if (allResponse.ok) {
        const data = await allResponse.json()
        setRequests(data.requests)
      }

      if (pendingResponse.ok) {
        const data = await pendingResponse.json()
        setPendingForMe(data.requests)
      }
    } catch (error) {
      console.error('Error fetching swap requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePeerResponse(requestId: string, accept: boolean) {
    try {
      const response = await fetch(`/api/schedule/swap/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peerResponse: { accept },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to respond to request')
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error responding to request:', error)
      alert('Failed to respond to request')
    }
  }

  async function handleManagerReview(requestId: string, approve: boolean, notes?: string) {
    try {
      const response = await fetch(`/api/schedule/swap/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerReview: { approve, notes },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to review request')
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error reviewing request:', error)
      alert('Failed to review request')
    }
  }

  async function handleCancel(requestId: string) {
    if (!confirm('Are you sure you want to cancel this request?')) return

    try {
      const response = await fetch(`/api/schedule/swap/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to cancel request')
        return
      }

      fetchData()
    } catch (error) {
      console.error('Error cancelling request:', error)
    }
  }

  function formatShift(shift: { date: string; startTime: string; endTime: string; shift?: { name: string } | null }) {
    const date = format(parseISO(shift.date), 'MMM d')
    const formatTime = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      const period = h >= 12 ? 'PM' : 'AM'
      return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${period}`
    }
    return `${date} ${formatTime(shift.startTime)}-${formatTime(shift.endTime)}${shift.shift ? ` (${shift.shift.name})` : ''}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Swaps</h1>
          <p className="text-gray-600 mt-1">
            Manage shift swap and giveaway requests
          </p>
        </div>

        <Link href="/dashboard/schedule" className="btn btn-secondary">
          &larr; Back to Schedule
        </Link>
      </div>

      {/* Pending For Me */}
      {pendingForMe.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-orange-700">
            Pending Your Response ({pendingForMe.length})
          </h2>
          <div className="space-y-3">
            {pendingForMe.map((request) => (
              <div key={request.id} className="card border-l-4 border-orange-400">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">
                      {request.requester.firstName} {request.requester.lastName} wants to{' '}
                      {request.swapType === 'SWAP' ? 'swap shifts' : 'give you their shift'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Their shift: {formatShift(request.originalShift)}
                    </div>
                    {request.targetShift && (
                      <div className="text-sm text-gray-600">
                        Your shift: {formatShift(request.targetShift)}
                      </div>
                    )}
                    {request.reason && (
                      <div className="text-sm text-gray-500 mt-1">
                        Reason: {request.reason}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePeerResponse(request.id, true)}
                      className="btn btn-primary text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handlePeerResponse(request.id, false)}
                      className="btn btn-secondary text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_PEER">Pending Response</option>
          <option value="PENDING_MANAGER">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="DENIED_PEER">Declined</option>
          <option value="DENIED_MANAGER">Denied</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* All Requests */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          No swap requests found
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-sm bg-gray-100 text-gray-700">
                      {SWAP_TYPE_LABELS[request.swapType]}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-sm ${STATUS_STYLES[request.status]}`}>
                      {STATUS_LABELS[request.status]}
                    </span>
                  </div>

                  <div className="font-medium">
                    {request.requester.firstName} {request.requester.lastName}
                    {request.targetUser && (
                      <span className="text-gray-500 font-normal">
                        {' '}
                        &harr; {request.targetUser.firstName} {request.targetUser.lastName}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    Original: {formatShift(request.originalShift)}
                  </div>

                  {request.targetShift && (
                    <div className="text-sm text-gray-600">
                      Target: {formatShift(request.targetShift)}
                    </div>
                  )}

                  {request.reason && (
                    <div className="text-sm text-gray-500 mt-1">
                      Reason: {request.reason}
                    </div>
                  )}

                  {request.managerNotes && (
                    <div className="text-sm text-gray-500 mt-1">
                      Manager notes: {request.managerNotes}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    Requested {format(parseISO(request.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Manager approval */}
                  {request.status === 'PENDING_MANAGER' && canApprove && (
                    <>
                      <button
                        onClick={() => handleManagerReview(request.id, true)}
                        className="btn btn-primary text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Reason for denial (optional):')
                          handleManagerReview(request.id, false, notes || undefined)
                        }}
                        className="btn btn-danger text-sm"
                      >
                        Deny
                      </button>
                    </>
                  )}

                  {/* Cancel own request */}
                  {['PENDING_PEER', 'PENDING_MANAGER'].includes(request.status) &&
                    request.requesterId === currentUserId && (
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
    </div>
  )
}
