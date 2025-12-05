'use client'

import { useState, useEffect } from 'react'
import { ScheduleEntry, SCHEDULE_STATUS_LABELS } from '@/types/schedule'

export default function OpenShiftsPage() {
  const [openShifts, setOpenShifts] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'emergency'>('all')

  useEffect(() => {
    fetchOpenShifts()
  }, [filter])

  const fetchOpenShifts = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      let url = `/api/schedule/entries?openShifts=true&startDate=${today}&status=PUBLISHED,DRAFT`

      if (filter === 'emergency') {
        url += '&emergency=true'
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setOpenShifts(data.filter((e: any) => e.status !== 'FILLED'))
      }
    } catch (error) {
      console.error('Error fetching open shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimShift = async (entryId: string) => {
    setClaiming(entryId)
    try {
      const response = await fetch(`/api/schedule/entries/${entryId}/claim`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove from list and show success
        setOpenShifts(openShifts.filter(s => s.id !== entryId))
        alert('Shift claimed successfully!')
      } else {
        alert(data.error || 'Failed to claim shift')
      }
    } catch (error) {
      console.error('Error claiming shift:', error)
      alert('Failed to claim shift')
    } finally {
      setClaiming(null)
    }
  }

  const handleJoinWaitlist = async (entryId: string) => {
    try {
      const response = await fetch(`/api/schedule/entries/${entryId}/waitlist`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Added to waitlist at position ${data.position}`)
      } else {
        alert(data.error || 'Failed to join waitlist')
      }
    } catch (error) {
      console.error('Error joining waitlist:', error)
      alert('Failed to join waitlist')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `In ${diffDays} days`
    return ''
  }

  // Group by date
  const groupedShifts: Record<string, ScheduleEntry[]> = {}
  openShifts.forEach((shift) => {
    const dateStr = new Date(shift.date).toISOString().split('T')[0]
    if (!groupedShifts[dateStr]) {
      groupedShifts[dateStr] = []
    }
    groupedShifts[dateStr].push(shift)
  })

  const sortedDates = Object.keys(groupedShifts).sort()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Open Shifts</h2>
          <p className="text-sm text-gray-500">Available shifts you can claim</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Shifts
          </button>
          <button
            onClick={() => setFilter('emergency')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'emergency'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🚨 Emergency Only
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading open shifts...</div>
      ) : openShifts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Shifts</h3>
          <p className="text-gray-500">
            {filter === 'emergency'
              ? 'There are no emergency shifts that need coverage.'
              : 'All shifts are currently filled. Check back later!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-medium text-gray-900">{formatDate(dateStr)}</h3>
                {getRelativeDate(dateStr) && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {getRelativeDate(dateStr)}
                  </span>
                )}
              </div>

              {/* Shifts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedShifts[dateStr].map((shift) => (
                  <div
                    key={shift.id}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                      shift.isEmergency ? 'border-l-red-500' : 'border-l-yellow-500'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {shift.startTime}
                          </div>
                          <div className="text-sm text-gray-500">
                            to {shift.endTime}
                          </div>
                        </div>
                        {shift.isEmergency && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                            🚨 Emergency
                          </span>
                        )}
                      </div>

                      {/* Shift Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Shift:</span>
                          <span className="font-medium text-gray-900">
                            {shift.shift?.name || 'Custom Shift'}
                          </span>
                        </div>
                        {shift.rink && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Location:</span>
                            <span className="font-medium text-gray-900">{shift.rink.name}</span>
                          </div>
                        )}
                        {shift.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                            {shift.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleClaimShift(shift.id)}
                          disabled={claiming === shift.id}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {claiming === shift.id ? 'Claiming...' : 'Claim Shift'}
                        </button>
                        <button
                          onClick={() => handleJoinWaitlist(shift.id)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Join Waitlist"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
