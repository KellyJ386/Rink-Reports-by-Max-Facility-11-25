'use client'

import { useState, useEffect } from 'react'
import { ScheduleEntry, SCHEDULE_STATUS_LABELS, SCHEDULE_STATUS_COLORS } from '@/types/schedule'

export default function MySchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchMySchedule()
  }, [view])

  const fetchMySchedule = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      let url = `/api/schedule/entries?`

      if (view === 'upcoming') {
        url += `startDate=${today}`
      } else {
        const pastDate = new Date()
        pastDate.setMonth(pastDate.getMonth() - 3)
        url += `startDate=${pastDate.toISOString().split('T')[0]}&endDate=${today}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
    return formatDate(dateStr)
  }

  // Group entries by date
  const groupedEntries: Record<string, ScheduleEntry[]> = {}
  entries.forEach((entry) => {
    const dateStr = new Date(entry.date).toISOString().split('T')[0]
    if (!groupedEntries[dateStr]) {
      groupedEntries[dateStr] = []
    }
    groupedEntries[dateStr].push(entry)
  })

  const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
    view === 'upcoming' ? a.localeCompare(b) : b.localeCompare(a)
  )

  return (
    <div className="p-6">
      {/* View Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setView('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming Shifts
        </button>
        <button
          onClick={() => setView('past')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'past'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Past Shifts
        </button>
      </div>

      {/* Schedule Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading your schedule...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {view === 'upcoming' ? 'No Upcoming Shifts' : 'No Past Shifts'}
          </h3>
          <p className="text-gray-500">
            {view === 'upcoming'
              ? 'You have no scheduled shifts coming up.'
              : 'No shift history found for the past 3 months.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => (
            <div key={dateStr} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{formatDate(dateStr)}</h3>
                  <span className="text-sm text-gray-500">{getRelativeDate(dateStr)}</span>
                </div>
              </div>

              {/* Shifts for this date */}
              <div className="divide-y">
                {groupedEntries[dateStr].map((entry) => (
                  <div key={entry.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {entry.startTime}
                          </div>
                          <div className="text-xs text-gray-500">to {entry.endTime}</div>
                        </div>

                        {/* Shift Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {entry.shift?.name || 'Custom Shift'}
                            </span>
                            {entry.rink && (
                              <span className="text-sm text-gray-500">
                                @ {entry.rink.name}
                              </span>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {entry.isEmergency && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                            Emergency
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          SCHEDULE_STATUS_COLORS[entry.status]
                        }`}>
                          {SCHEDULE_STATUS_LABELS[entry.status]}
                        </span>
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
