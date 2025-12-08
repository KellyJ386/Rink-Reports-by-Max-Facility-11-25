'use client'

import { useState, useEffect } from 'react'

interface ScheduleEntry {
  id: string
  userId: string
  shiftId?: string
  rinkId?: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  role: {
    id: string
    name: string
  }
}

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
}

interface ScheduleEntryModalProps {
  entry: ScheduleEntry | null
  onClose: () => void
  onSave: () => void
  canPublish: boolean
}

export default function ScheduleEntryModal({
  entry,
  onClose,
  onSave,
  canPublish,
}: ScheduleEntryModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [formData, setFormData] = useState({
    userId: entry?.userId || '',
    shiftId: entry?.shiftId || '',
    date: entry ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: entry?.startTime || '',
    endTime: entry?.endTime || '',
    isOpenShift: entry?.isOpenShift || false,
    isEmergency: entry?.isEmergency || false,
  })

  useEffect(() => {
    fetchEmployees()
    fetchShifts()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (res.ok) {
        setEmployees(data.employees || [])
      }
    } catch (err) {
      console.error('Error fetching employees:', err)
    }
  }

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/shifts')
      const data = await res.json()
      if (res.ok) {
        setShifts(data.shifts?.filter((s: ShiftDefinition & { isActive: boolean }) => s.isActive) || [])
      }
    } catch (err) {
      console.error('Error fetching shifts:', err)
    }
  }

  const handleShiftSelect = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId)
    if (shift) {
      setFormData({
        ...formData,
        shiftId,
        startTime: shift.startTime,
        endTime: shift.endTime,
      })
    } else {
      setFormData({
        ...formData,
        shiftId: '',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = entry ? `/api/schedule/${entry.id}` : '/api/schedule'
      const method = entry ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.isOpenShift ? undefined : formData.userId,
          shiftId: formData.shiftId || undefined,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          isOpenShift: formData.isOpenShift,
          isEmergency: formData.isEmergency,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        onSave()
      } else {
        setError(data.error || 'Failed to save schedule entry')
      }
    } catch (err) {
      setError('Failed to save schedule entry')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!entry) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/schedule/${entry.id}/publish`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        onSave()
      } else {
        setError(data.error || 'Failed to publish')
      }
    } catch (err) {
      setError('Failed to publish')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!entry || !confirm('Are you sure you want to delete this schedule entry?')) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/schedule/${entry.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        onSave()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
      }
    } catch (err) {
      setError('Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {entry ? 'Edit Schedule Entry' : 'New Schedule Entry'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Entry Type */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isOpenShift}
                onChange={(e) => setFormData({ ...formData, isOpenShift: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Open Shift</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isEmergency}
                onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-red-600">Emergency Coverage</span>
            </label>
          </div>

          {/* Employee Selection (hidden for open shifts) */}
          {!formData.isOpenShift && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="input"
                required
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

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>

          {/* Shift Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Template (optional)
            </label>
            <select
              value={formData.shiftId}
              onChange={(e) => handleShiftSelect(e.target.value)}
              className="input"
            >
              <option value="">Custom times...</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          {/* Status indicator for editing */}
          {entry && (
            <div className="text-sm text-gray-500">
              Status: <span className="font-medium">{entry.status}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {entry && entry.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </button>
              {entry && entry.status === 'DRAFT' && canPublish && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={loading}
                  className="btn-success"
                >
                  Publish
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : entry ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
