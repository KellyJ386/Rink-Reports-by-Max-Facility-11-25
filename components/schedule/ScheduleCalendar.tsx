'use client'

import { useState, useEffect } from 'react'

interface ScheduleEntry {
  id: string
  userId: string | null
  userName: string | null
  shiftId: string
  shiftName: string
  rinkId: string
  rinkName: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  color: string
}

interface ScheduleCalendarProps {
  isAdmin?: boolean
}

export default function ScheduleCalendar({ isAdmin = false }: ScheduleCalendarProps) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'month'>('week')
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)

  useEffect(() => {
    fetchSchedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view])

  async function fetchSchedule() {
    try {
      setLoading(true)
      const startDate = getStartDate()
      const endDate = getEndDate()
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      const response = await fetch(`/api/schedule?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStartDate() {
    const date = new Date(currentDate)
    if (view === 'week') {
      const day = date.getDay()
      date.setDate(date.getDate() - day)
    } else {
      date.setDate(1)
    }
    return date
  }

  function getEndDate() {
    const date = new Date(currentDate)
    if (view === 'week') {
      const day = date.getDay()
      date.setDate(date.getDate() + (6 - day))
    } else {
      date.setMonth(date.getMonth() + 1)
      date.setDate(0)
    }
    return date
  }

  function getDaysInView() {
    const days = []
    const start = getStartDate()
    const end = getEndDate()
    const current = new Date(start)

    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  function navigatePrev() {
    const newDate = new Date(currentDate)
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  function navigateNext() {
    const newDate = new Date(currentDate)
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  async function claimShift(entryId: string) {
    try {
      const response = await fetch(`/api/schedule/${entryId}/claim`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchSchedule()
        setSelectedEntry(null)
      }
    } catch (error) {
      console.error('Failed to claim shift:', error)
    }
  }

  function getEntriesForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return entries.filter(e => e.date === dateStr)
  }

  function formatDateHeader(date: Date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function isToday(date: Date) {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const days = getDaysInView()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrev}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Month
            </button>
          </div>
          {isAdmin && (
            <a
              href="/dashboard/admin/schedule"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Manage Schedule
            </a>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading schedule...</div>
      ) : (
        <div className={`grid ${view === 'week' ? 'grid-cols-7' : 'grid-cols-7'} divide-x divide-gray-200`}>
          {days.map((day, index) => (
            <div
              key={index}
              className={`min-h-[150px] ${view === 'month' && day.getMonth() !== currentDate.getMonth() ? 'bg-gray-50' : ''}`}
            >
              {/* Day Header */}
              <div className={`px-2 py-2 text-center border-b border-gray-200 ${isToday(day) ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>
                <span className={`text-sm font-medium ${isToday(day) ? 'text-white' : 'text-gray-900'}`}>
                  {formatDateHeader(day)}
                </span>
              </div>

              {/* Day Entries */}
              <div className="p-1 space-y-1">
                {getEntriesForDate(day).map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate ${
                      entry.isOpenShift
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 border-dashed'
                        : entry.isEmergency
                        ? 'bg-red-100 text-red-800'
                        : 'text-white'
                    }`}
                    style={!entry.isOpenShift && !entry.isEmergency ? { backgroundColor: entry.color } : undefined}
                  >
                    <span>{entry.startTime} - {entry.endTime}</span>
                    <br />
                    <span className="opacity-90">
                      {entry.isOpenShift ? '⚠️ Open Shift' : entry.userName || entry.shiftName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEntry.shiftName}
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{selectedEntry.startTime} - {selectedEntry.endTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rink</p>
                  <p className="font-medium">{selectedEntry.rinkName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedEntry.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    selectedEntry.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                    selectedEntry.status === 'FILLED' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedEntry.status}
                  </span>
                </div>
              </div>

              {selectedEntry.userName ? (
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{selectedEntry.userName}</p>
                </div>
              ) : selectedEntry.isOpenShift && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 font-medium">This shift is open for claiming!</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
              {selectedEntry.isOpenShift && (
                <button
                  onClick={() => claimShift(selectedEntry.id)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Claim Shift
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">Morning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">Evening</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <span className="text-gray-600">Overnight</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-dashed border-amber-400 bg-amber-100" />
            <span className="text-gray-600">Open Shift</span>
          </div>
        </div>
      </div>
    </div>
  )
}
