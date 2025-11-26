'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { PageHeader } from '@/components/shared'
import Calendar from '@/components/schedule/Calendar'

interface ScheduleEntry {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  userId: string
  user?: {
    firstName: string
    lastName: string
  }
  status: string
  isOpenShift: boolean
  isEmergency: boolean
}

export default function SchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [view, setView] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const start = view === 'week'
        ? startOfWeek(selectedDate, { weekStartsOn: 0 })
        : startOfMonth(selectedDate)
      const end = view === 'week'
        ? endOfWeek(selectedDate, { weekStartsOn: 0 })
        : endOfMonth(selectedDate)

      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })

      const response = await fetch(`/api/schedule?${params}`)
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [view, selectedDate])

  const handleEntryClick = (entry: ScheduleEntry) => {
    setSelectedEntry(entry)
    setShowModal(true)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="View and manage employee schedules"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-secondary"
            >
              + Add Shift
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <Calendar
          entries={entries}
          view={view}
          onViewChange={setView}
          onDateSelect={handleDateSelect}
          onEntryClick={handleEntryClick}
          selectedDate={selectedDate}
        />
      )}

      {/* Entry Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {selectedEntry ? 'Shift Details' : 'Add Shift'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedEntry(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {selectedEntry ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedEntry.date), 'EEEE, MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium">
                      {selectedEntry.startTime} - {selectedEntry.endTime}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="font-medium">
                    {selectedEntry.isOpenShift
                      ? 'Open Shift (Unassigned)'
                      : `${selectedEntry.user?.firstName} ${selectedEntry.user?.lastName}`
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEntry.status === 'PUBLISHED'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedEntry.status === 'FILLED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEntry.status}
                  </span>
                  {selectedEntry.isEmergency && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Emergency
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedEntry(null)
                    }}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Schedule management features coming soon. Use the Admin module to configure shifts.
                </p>
                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
