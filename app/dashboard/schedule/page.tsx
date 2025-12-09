'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, parseISO } from 'date-fns'

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: { name: string }
}

interface ScheduleEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'CANCELLED'
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
}

export default function SchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Generate days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')

      const [entriesRes, employeesRes, shiftsRes, meRes] = await Promise.all([
        fetch(`/api/schedule?startDate=${startDate}&endDate=${endDate}`),
        fetch('/api/employees'),
        fetch('/api/shifts'),
        fetch('/api/auth/me'),
      ])

      if (entriesRes.ok) {
        setEntries(await entriesRes.json())
      }
      if (employeesRes.ok) {
        setEmployees(await employeesRes.json())
      }
      if (shiftsRes.ok) {
        setShifts(await shiftsRes.json())
      }
      if (meRes.ok) {
        const userData = await meRes.json()
        setCurrentUserId(userData.id)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentWeekStart])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return entries.filter((entry) => entry.date.startsWith(dateStr))
  }

  const handlePrevWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1))
  const handleNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1))
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))

  const handleAddEntry = (date: Date) => {
    setSelectedDate(date)
    setShowAddModal(true)
  }

  const handleClaimShift = async (entryId: string) => {
    try {
      const res = await fetch(`/api/schedule/${entryId}/claim`, {
        method: 'POST',
      })
      if (res.ok) {
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to claim shift')
      }
    } catch (error) {
      console.error('Error claiming shift:', error)
      alert('Failed to claim shift')
    }
  }

  const getStatusColor = (entry: ScheduleEntry) => {
    if (entry.isEmergency) return 'bg-red-100 border-red-300 text-red-800'
    if (entry.isOpenShift) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    switch (entry.status) {
      case 'DRAFT':
        return 'bg-gray-100 border-gray-300 text-gray-600'
      case 'PUBLISHED':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'FILLED':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 border-red-300 text-red-500 line-through'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Schedule</h1>
          <p className="text-gray-600">Manage shifts and view the weekly schedule</p>
        </div>
        <a
          href="/dashboard/schedule/shifts"
          className="btn-primary"
        >
          Manage Shifts
        </a>
      </div>

      {/* Week Navigation */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <span className="text-xl">&larr;</span>
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </h2>
            <button
              onClick={handleToday}
              className="text-sm text-blue-600 hover:underline"
            >
              Today
            </button>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <span className="text-xl">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Published</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Filled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Open Shift</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Emergency</span>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {/* Header Row */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`text-center p-2 font-semibold rounded-t-lg ${
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <div className="text-xs uppercase">{format(day, 'EEE')}</div>
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
          ))}

          {/* Day Cells */}
          {weekDays.map((day) => {
            const dayEntries = getEntriesForDate(day)
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
            return (
              <div
                key={`cell-${day.toISOString()}`}
                className={`min-h-[200px] border rounded-b-lg p-2 ${
                  isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="space-y-2">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-2 rounded border text-xs ${getStatusColor(entry)}`}
                    >
                      <div className="font-semibold">
                        {entry.startTime} - {entry.endTime}
                      </div>
                      <div>
                        {entry.isOpenShift ? (
                          <span className="italic">Open Shift</span>
                        ) : (
                          `${entry.user.firstName} ${entry.user.lastName}`
                        )}
                      </div>
                      {entry.isOpenShift && entry.status === 'PUBLISHED' && entry.user.id !== currentUserId && (
                        <button
                          onClick={() => handleClaimShift(entry.id)}
                          className="mt-1 w-full text-xs bg-yellow-500 text-white rounded px-2 py-1 hover:bg-yellow-600"
                        >
                          Claim Shift
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleAddEntry(day)}
                  className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1"
                >
                  + Add
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && selectedDate && (
        <AddEntryModal
          date={selectedDate}
          employees={employees}
          shifts={shifts}
          onClose={() => {
            setShowAddModal(false)
            setSelectedDate(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setSelectedDate(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

// Add Entry Modal Component
function AddEntryModal({
  date,
  employees,
  shifts,
  onClose,
  onSuccess,
}: {
  date: Date
  employees: Employee[]
  shifts: ShiftDefinition[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    userId: '',
    shiftId: '',
    startTime: '09:00',
    endTime: '17:00',
    isOpenShift: false,
    isEmergency: false,
    status: 'DRAFT' as const,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleShiftSelect = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    if (shift) {
      setFormData((prev) => ({
        ...prev,
        shiftId,
        startTime: shift.startTime,
        endTime: shift.endTime,
      }))
    } else {
      setFormData((prev) => ({ ...prev, shiftId: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: format(date, 'yyyy-MM-dd'),
          userId: formData.isOpenShift ? undefined : formData.userId,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create schedule entry')
      }
    } catch (err) {
      setError('Failed to create schedule entry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Add Schedule Entry - {format(date, 'MMM d, yyyy')}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isOpenShift}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isOpenShift: e.target.checked }))
                }
              />
              <span>Open Shift (anyone can claim)</span>
            </label>
          </div>

          {!formData.isOpenShift && (
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, userId: e.target.value }))
                }
                className="input-field"
                required={!formData.isOpenShift}
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.role.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Shift Template (optional)</label>
            <select
              value={formData.shiftId}
              onChange={(e) => handleShiftSelect(e.target.value)}
              className="input-field"
            >
              <option value="">Custom times...</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isEmergency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isEmergency: e.target.checked }))
                }
              />
              <span className="text-red-600">Emergency Coverage</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as typeof formData.status,
                }))
              }
              className="input-field"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
