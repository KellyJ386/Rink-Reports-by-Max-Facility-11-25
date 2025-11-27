'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ScheduleEntry {
  id: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  userId: string
  createdById: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
}

interface User {
  id: string
  firstName: string
  lastName: string
  role: { name: string }
}

interface UserPermissions {
  id: string
  role: {
    permissions: {
      schedule: {
        access: boolean
        viewOwn: boolean
        viewAll: boolean
        create: boolean
        edit: boolean
        delete: boolean
        publish: boolean
      }
    }
  }
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default function SchedulePage() {
  const [loading, setLoading] = useState(true)
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<UserPermissions | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)

  // Get current week dates
  const today = new Date()
  const weekDates = getWeekDates(today)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch schedule entries, shifts, users, and current user permissions in parallel
      const [scheduleRes, shiftsRes, usersRes, meRes] = await Promise.all([
        fetch(`/api/schedule?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`),
        fetch('/api/shifts'),
        fetch('/api/users'),
        fetch('/api/auth/me'),
      ])

      const [scheduleData, shiftsData, usersData, meData] = await Promise.all([
        scheduleRes.json(),
        shiftsRes.json(),
        usersRes.json(),
        meRes.json(),
      ])

      setScheduleEntries(scheduleData.entries || [])
      setShifts(shiftsData.shifts || [])
      setUsers(usersData.users || [])
      setCurrentUser(meData.user || null)
    } catch (err) {
      setError('Failed to load schedule data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) {
      return
    }

    setDeleting(entryId)
    setError('')

    try {
      const response = await fetch(`/api/schedule/${entryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      setScheduleEntries(scheduleEntries.filter((e) => e.id !== entryId))
      setSelectedEntry(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shift')
    } finally {
      setDeleting(null)
    }
  }

  const canCreate = currentUser?.role?.permissions?.schedule?.create
  const canDelete = currentUser?.role?.permissions?.schedule?.delete

  // Group entries by date
  const entriesByDate: Record<string, ScheduleEntry[]> = {}
  weekDates.forEach((d) => {
    const key = d.toISOString().split('T')[0]
    entriesByDate[key] = scheduleEntries.filter(
      (e) => new Date(e.date).toISOString().split('T')[0] === key
    )
  })

  // Get open shifts
  const openShifts = scheduleEntries.filter((e) => e.isOpenShift && e.status !== 'FILLED')

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 text-sm mt-1">
            Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Link href="/dashboard/schedule/new" className="btn btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Shift
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Open Shifts Alert */}
      {openShifts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">OPEN</span>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800">Open Shifts Available</h3>
              <p className="text-orange-700 text-sm">
                {openShifts.length} shift{openShifts.length > 1 ? 's' : ''} need coverage
              </p>
            </div>
            <Link href="/dashboard/schedule/open" className="btn btn-secondary text-sm">
              View Open Shifts
            </Link>
          </div>
        </div>
      )}

      {/* Week View Calendar */}
      <div className="card mb-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDates.map((date, idx) => {
              const dateKey = date.toISOString().split('T')[0]
              const entries = entriesByDate[dateKey] || []
              const isToday = date.toDateString() === today.toDateString()

              return (
                <div key={idx} className="bg-white">
                  <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className="text-sm text-gray-500">{dayNames[idx]}</div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="p-2 min-h-[200px] space-y-2">
                    {entries.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-4">No shifts</div>
                    ) : (
                      entries.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className={`p-2 rounded text-sm cursor-pointer hover:ring-2 hover:ring-blue-300 ${
                            entry.isOpenShift
                              ? 'bg-orange-100 border border-orange-300'
                              : entry.isEmergency
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <div className="font-medium truncate">
                            {entry.isOpenShift ? 'OPEN SHIFT' : `${entry.user.firstName} ${entry.user.lastName.charAt(0)}.`}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </div>
                          {entry.isEmergency && (
                            <span className="text-xs text-red-600 font-medium">Emergency</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Shift Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEntry(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shift Details</h3>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Date</dt>
                <dd className="font-medium">
                  {new Date(selectedEntry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Time</dt>
                <dd className="font-medium">
                  {formatTime(selectedEntry.startTime)} - {formatTime(selectedEntry.endTime)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Assigned To</dt>
                <dd className="font-medium">
                  {selectedEntry.isOpenShift
                    ? 'Open Shift - Not Assigned'
                    : `${selectedEntry.user.firstName} ${selectedEntry.user.lastName}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedEntry.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    selectedEntry.status === 'FILLED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedEntry.status}
                  </span>
                </dd>
              </div>
              {selectedEntry.isEmergency && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                  Emergency Coverage Required
                </div>
              )}
            </dl>
            {(canDelete || selectedEntry.createdById === currentUser?.id) && (
              <div className="mt-6 pt-4 border-t flex justify-end">
                <button
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  disabled={deleting === selectedEntry.id}
                  className="btn btn-secondary text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === selectedEntry.id ? 'Deleting...' : 'Delete Shift'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift Definitions and Staff */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shift Definitions</h2>
          {shifts.length === 0 ? (
            <p className="text-gray-400 text-sm">No shifts defined yet</p>
          ) : (
            <div className="space-y-2">
              {shifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{shift.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </div>
                  {shift.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff</h2>
          {users.length === 0 ? (
            <p className="text-gray-400 text-sm">No staff members</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-gray-500">{u.role.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Schedule */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Upcoming Shifts</h2>
        {(() => {
          const myShifts = scheduleEntries.filter(
            (e) => e.userId === currentUser?.id && new Date(e.date) >= today
          )
          if (myShifts.length === 0) {
            return <p className="text-gray-400 text-sm">No upcoming shifts scheduled</p>
          }
          return (
            <div className="space-y-2">
              {myShifts.slice(0, 5).map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    shift.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shift.status === 'PUBLISHED' ? 'Confirmed' : shift.status}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
