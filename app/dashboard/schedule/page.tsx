'use client'

import { useState, useEffect, useMemo } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
}

interface ScheduleEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  user: User
}

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-200 border-gray-400 text-gray-700',
  PUBLISHED: 'bg-blue-100 border-blue-400 text-blue-800',
  FILLED: 'bg-green-100 border-green-400 text-green-800',
  CANCELLED: 'bg-red-100 border-red-400 text-red-800 line-through',
}

export default function SchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday
    return new Date(now.setDate(diff))
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Generate week days
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart)
      day.setDate(day.getDate() + i)
      days.push(day)
    }
    return days
  }, [currentWeekStart])

  useEffect(() => {
    fetchData()
  }, [currentWeekStart])

  async function fetchData() {
    setIsLoading(true)
    try {
      const endDate = new Date(currentWeekStart)
      endDate.setDate(endDate.getDate() + 6)

      const [entriesRes, shiftsRes, usersRes] = await Promise.all([
        fetch(`/api/schedule?startDate=${currentWeekStart.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch('/api/schedule/shifts'),
        fetch('/api/users'),
      ])

      if (entriesRes.ok) {
        const data = await entriesRes.json()
        setEntries(data)
      }

      if (shiftsRes.ok) {
        const data = await shiftsRes.json()
        setShifts(data)
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data)
      }
    } catch (err) {
      setError('Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const navigateWeek = (direction: number) => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + direction * 7)
    setCurrentWeekStart(newStart)
  }

  const goToToday = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    setCurrentWeekStart(new Date(now.setDate(diff)))
  }

  const getEntriesForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return entries.filter((e) => e.date.split('T')[0] === dateStr)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  const handleAddEntry = async (data: {
    userId: string
    date: string
    startTime: string
    endTime: string
    isOpenShift: boolean
  }) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create entry')
      }

      const entry = await response.json()
      setEntries((prev) => [...prev, entry])
      setShowAddModal(false)
      setSelectedDate(null)
    } catch (err) {
      setError('Failed to add schedule entry')
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-gray-500">Manage staff schedules and shifts</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date())
              setShowAddModal(true)
            }}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                isToday(day) ? 'bg-purple-50' : ''
              }`}
            >
              <div className="text-xs text-gray-500 uppercase">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-semibold ${isToday(day) ? 'text-purple-600' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, idx) => {
            const dayEntries = getEntriesForDay(day)
            return (
              <div
                key={idx}
                className={`p-2 border-r border-gray-200 last:border-r-0 ${
                  isToday(day) ? 'bg-purple-50/50' : ''
                }`}
                onClick={() => {
                  setSelectedDate(day)
                  setShowAddModal(true)
                }}
              >
                <div className="space-y-1 cursor-pointer min-h-[100px]">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-2 rounded border-l-4 text-xs ${STATUS_COLORS[entry.status] || 'bg-gray-100'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-medium">
                        {entry.user.firstName} {entry.user.lastName[0]}.
                      </div>
                      <div className="text-gray-600">
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </div>
                      {entry.isOpenShift && (
                        <span className="inline-block mt-1 px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          Open
                        </span>
                      )}
                      {entry.isEmergency && (
                        <span className="inline-block mt-1 px-1 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          Emergency
                        </span>
                      )}
                    </div>
                  ))}
                  {dayEntries.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs hover:text-gray-600">
                      + Add
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400"></div>
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></div>
          <span>Published</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div>
          <span>Filled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400"></div>
          <span>Open Shift</span>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && selectedDate && (
        <AddEntryModal
          date={selectedDate}
          users={users}
          shifts={shifts}
          onClose={() => {
            setShowAddModal(false)
            setSelectedDate(null)
          }}
          onSubmit={handleAddEntry}
        />
      )}
    </div>
  )
}

interface AddEntryModalProps {
  date: Date
  users: User[]
  shifts: ShiftDefinition[]
  onClose: () => void
  onSubmit: (data: any) => void
}

function AddEntryModal({ date, users, shifts, onClose, onSubmit }: AddEntryModalProps) {
  const [userId, setUserId] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [isOpenShift, setIsOpenShift] = useState(false)
  const [selectedShift, setSelectedShift] = useState('')

  const handleShiftSelect = (shiftId: string) => {
    setSelectedShift(shiftId)
    const shift = shifts.find((s) => s.id === shiftId)
    if (shift) {
      setStartTime(shift.startTime)
      setEndTime(shift.endTime)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      userId: isOpenShift ? undefined : userId,
      date: date.toISOString(),
      startTime,
      endTime,
      isOpenShift,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Schedule Entry
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="text"
              value={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>

          {shifts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select Shift</label>
              <div className="flex gap-2 flex-wrap">
                {shifts.map((shift) => (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => handleShiftSelect(shift.id)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      selectedShift === shift.id
                        ? 'bg-purple-100 border-purple-400 text-purple-700'
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {shift.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isOpenShift}
                onChange={(e) => setIsOpenShift(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700">Open Shift (anyone can claim)</span>
            </label>
          </div>

          {!isOpenShift && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
