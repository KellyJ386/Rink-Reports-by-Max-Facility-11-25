'use client'

import { useState, useEffect } from 'react'

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
  rinkId: string | null
  isActive: boolean
}

interface Rink {
  id: string
  name: string
}

const SHIFT_COLORS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Yellow', value: '#EAB308' },
]

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default function ShiftDefinitionsPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [isEditing, setIsEditing] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startTime: '06:00',
    endTime: '14:00',
    color: '#3B82F6',
    rinkId: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [shiftsRes, rinksRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/rinks'),
      ])

      const [shiftsData, rinksData] = await Promise.all([
        shiftsRes.json(),
        rinksRes.json(),
      ])

      if (shiftsRes.ok) setShifts(shiftsData.shifts || [])
      if (rinksRes.ok) setRinks(rinksData.rinks || [])
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Shift name is required' })
      return
    }

    if (!formData.startTime || !formData.endTime) {
      setMessage({ type: 'error', text: 'Start and end times are required' })
      return
    }

    // Validate end time is after start time
    if (formData.endTime <= formData.startTime) {
      setMessage({ type: 'error', text: 'End time must be after start time' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts'
      const method = editingShift ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          startTime: formData.startTime,
          endTime: formData.endTime,
          color: formData.color || null,
          rinkId: formData.rinkId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save shift')
      }

      setMessage({ type: 'success', text: editingShift ? 'Shift updated successfully' : 'Shift created successfully' })
      resetForm()
      fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save shift' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (shift: ShiftDefinition) => {
    setEditingShift(shift)
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color || '#3B82F6',
      rinkId: shift.rinkId || '',
    })
    setIsEditing(true)
  }

  const handleDelete = async (shift: ShiftDefinition) => {
    if (!confirm(`Are you sure you want to deactivate "${shift.name}"? This shift will no longer be available for new schedule entries.`)) {
      return
    }

    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete shift')
      }

      setMessage({ type: 'success', text: 'Shift deactivated successfully' })
      fetchData()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete shift' })
    }
  }

  const resetForm = () => {
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '06:00',
      endTime: '14:00',
      color: '#3B82F6',
      rinkId: '',
    })
    setIsEditing(false)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Definitions</h1>
          <p className="text-gray-600 text-sm mt-1">Define shift templates for scheduling staff</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            Add Shift
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {isEditing && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingShift ? 'Edit Shift' : 'Add New Shift'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Morning Shift, Evening Shift"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
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
                  End Time <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {SHIFT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {rinks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rink Assignment (Optional)
                </label>
                <select
                  value={formData.rinkId}
                  onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
                  className="input"
                >
                  <option value="">All rinks / Facility-wide</option>
                  {rinks.map((rink) => (
                    <option key={rink.id} value={rink.id}>{rink.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Optionally limit this shift to a specific rink
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shifts List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Shifts</h2>
        {shifts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🕐</div>
            <p>No shift definitions yet</p>
            <p className="text-sm">Add your first shift template to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div key={shift.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {shift.color && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: shift.color }}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                      {shift.rinkId && rinks.find(r => r.id === shift.rinkId) && (
                        <>
                          <span>•</span>
                          <span>{rinks.find(r => r.id === shift.rinkId)?.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(shift)}
                    className="btn btn-secondary text-sm py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(shift)}
                    className="btn btn-secondary text-sm py-1 text-red-600 hover:bg-red-50"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">About Shift Definitions</h3>
        <p className="text-sm text-blue-700">
          Shift definitions are templates that make scheduling faster. When creating a schedule entry,
          staff can select a shift template to auto-fill the start and end times. Colors help
          visually distinguish different shifts on the calendar.
        </p>
      </div>
    </div>
  )
}
