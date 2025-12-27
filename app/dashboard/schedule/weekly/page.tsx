'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string
  minStaffRequired: number
  maxStaffAllowed: number
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ScheduleEntry {
  id: string
  userId: string | null
  shiftId: string | null
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  user?: User | null
}

interface CellAssignment {
  odayIndex: number
  shiftId: string
  userId: string | null
  entryId?: string
}

export default function WeeklySchedulePage() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday
    return new Date(today.setDate(diff))
  })

  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ dayIndex: number; shiftId: string } | null>(null)
  const [pendingChanges, setPendingChanges] = useState<Map<string, string | null>>(new Map())

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const getWeekDates = () => {
    return weekDays.map((_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      return date
    })
  }

  const weekDates = getWeekDates()

  useEffect(() => {
    fetchData()
  }, [weekStart])

  const fetchData = async () => {
    setLoading(true)
    try {
      const endDate = new Date(weekStart)
      endDate.setDate(weekStart.getDate() + 6)

      const [shiftsRes, usersRes, entriesRes] = await Promise.all([
        fetch('/api/schedule/shifts'),
        fetch('/api/users'),
        fetch(`/api/schedule/entries?startDate=${weekStart.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
      ])

      if (shiftsRes.ok) setShifts(await shiftsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (entriesRes.ok) setEntries(await entriesRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCellKey = (dayIndex: number, shiftId: string) => `${dayIndex}-${shiftId}`

  const getEntryForCell = (dayIndex: number, shiftId: string): ScheduleEntry | undefined => {
    const date = weekDates[dayIndex].toISOString().split('T')[0]
    return entries.find(e =>
      e.date.split('T')[0] === date && e.shiftId === shiftId
    )
  }

  const getAssignedUser = (dayIndex: number, shiftId: string): string | null => {
    const cellKey = getCellKey(dayIndex, shiftId)
    if (pendingChanges.has(cellKey)) {
      return pendingChanges.get(cellKey) || null
    }
    const entry = getEntryForCell(dayIndex, shiftId)
    return entry?.userId || null
  }

  const handleCellClick = (dayIndex: number, shiftId: string) => {
    setSelectedCell({ dayIndex, shiftId })
  }

  const handleUserSelect = (userId: string | null) => {
    if (!selectedCell) return

    const cellKey = getCellKey(selectedCell.dayIndex, selectedCell.shiftId)
    const newChanges = new Map(pendingChanges)
    newChanges.set(cellKey, userId)
    setPendingChanges(newChanges)
    setSelectedCell(null)
  }

  const saveSchedule = async () => {
    if (pendingChanges.size === 0) return

    setSaving(true)
    try {
      const operations: Array<{
        date: string
        shiftId: string
        userId: string | null
        existingEntryId?: string
      }> = []

      pendingChanges.forEach((userId, cellKey) => {
        const [dayIndex, shiftId] = cellKey.split('-')
        const date = weekDates[parseInt(dayIndex)].toISOString().split('T')[0]
        const existingEntry = getEntryForCell(parseInt(dayIndex), shiftId)

        operations.push({
          date,
          shiftId,
          userId,
          existingEntryId: existingEntry?.id
        })
      })

      const response = await fetch('/api/schedule/entries/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      })

      if (response.ok) {
        setPendingChanges(new Map())
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(weekStart)
    newDate.setDate(weekStart.getDate() + (direction === 'next' ? 7 : -7))
    setWeekStart(newDate)
    setPendingChanges(new Map())
  }

  const goToToday = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    setWeekStart(new Date(today.setDate(diff)))
    setPendingChanges(new Map())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getUserName = (userId: string | null) => {
    if (!userId) return null
    const user = users.find(u => u.id === userId)
    return user ? `${user.firstName} ${user.lastName.charAt(0)}.` : null
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-sm text-gray-500">Click cells to assign employees to shifts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/schedule"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Calendar View
          </Link>
          {pendingChanges.size > 0 && (
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Save Changes (${pendingChanges.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-3 py-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            ← Previous Week
          </button>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-900">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="px-3 py-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      {shifts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shifts Defined</h3>
          <p className="text-gray-500 mb-4">Create shift definitions first to start scheduling.</p>
          <Link
            href="/dashboard/admin/shifts"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Create Shifts
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Shift
                  </th>
                  {weekDates.map((date, i) => (
                    <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      <div>{weekDays[i]}</div>
                      <div className="text-gray-400 font-normal">{formatDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: shift.color || '#3B82F6' }}
                        />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{shift.name}</div>
                          <div className="text-xs text-gray-500">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((_, dayIndex) => {
                      const assignedUserId = getAssignedUser(dayIndex, shift.id)
                      const userName = getUserName(assignedUserId)
                      const cellKey = getCellKey(dayIndex, shift.id)
                      const hasChange = pendingChanges.has(cellKey)
                      const isSelected = selectedCell?.dayIndex === dayIndex && selectedCell?.shiftId === shift.id

                      return (
                        <td key={dayIndex} className="px-2 py-2">
                          <button
                            onClick={() => handleCellClick(dayIndex, shift.id)}
                            className={`w-full min-h-[48px] px-2 py-2 rounded-lg border-2 transition-all text-sm ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : hasChange
                                ? 'border-yellow-400 bg-yellow-50'
                                : assignedUserId
                                ? 'border-green-200 bg-green-50 hover:border-green-400'
                                : 'border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {userName ? (
                              <span className="font-medium text-gray-900">{userName}</span>
                            ) : (
                              <span className="text-gray-400">+ Assign</span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Selector Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Employee
              </h3>
              <p className="text-sm text-gray-500">
                {weekDays[selectedCell.dayIndex]} - {shifts.find(s => s.id === selectedCell.shiftId)?.name}
              </p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <button
                onClick={() => handleUserSelect(null)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 rounded-lg text-gray-500 mb-2"
              >
                Leave Unassigned (Open Shift)
              </button>
              <div className="border-t pt-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 rounded-lg flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-medium text-sm">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t">
              <button
                onClick={() => setSelectedCell(null)}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded"></div>
          <span>Unassigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-200 bg-green-50 rounded"></div>
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-50 rounded"></div>
          <span>Pending Change</span>
        </div>
      </div>
    </div>
  )
}
