'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
  isActive: boolean
  rinkId: string | null
}

interface Rink {
  id: string
  name: string
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    color: '#3B82F6',
    rinkId: '',
  })

  useEffect(() => {
    fetchShifts()
    fetchRinks()
  }, [])

  const fetchShifts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/shifts')
      const data = await res.json()

      if (res.ok) {
        setShifts(data.shifts || [])
      } else {
        setError(data.error || 'Failed to load shifts')
      }
    } catch (err) {
      setError('Failed to load shifts')
    } finally {
      setLoading(false)
    }
  }

  const fetchRinks = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      // Note: We'd need a rinks endpoint, for now we'll skip this
    } catch (err) {
      console.error('Error fetching rinks:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts'
      const method = editingShift ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          startTime: formData.startTime,
          endTime: formData.endTime,
          color: formData.color,
          rinkId: formData.rinkId || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        await fetchShifts()
        resetForm()
      } else {
        setError(data.error || 'Failed to save shift')
      }
    } catch (err) {
      setError('Failed to save shift')
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
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return

    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchShifts()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete shift')
      }
    } catch (err) {
      setError('Failed to delete shift')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      color: '#3B82F6',
      rinkId: '',
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const activeShifts = shifts.filter(s => s.isActive)
  const inactiveShifts = shifts.filter(s => !s.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading shifts...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/schedule" className="text-blue-600 hover:underline">
              ← Back to Schedule
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Definitions</h1>
          <p className="text-gray-600">Configure standard shifts for your facility</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Add Shift
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingShift ? 'Edit Shift' : 'Add New Shift'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Morning, Evening, Overnight"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{formData.color}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingShift ? 'Update Shift' : 'Create Shift'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Shifts */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Active Shifts</h2>
        {activeShifts.length === 0 ? (
          <p className="text-gray-500">No active shifts defined. Create your first shift above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Color</th>
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Start Time</th>
                  <th className="text-left py-2 px-4">End Time</th>
                  <th className="text-left py-2 px-4">Duration</th>
                  <th className="text-right py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeShifts.map((shift) => {
                  const start = shift.startTime.split(':').map(Number)
                  const end = shift.endTime.split(':').map(Number)
                  let duration = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1])
                  if (duration < 0) duration += 24 * 60 // Overnight shift
                  const hours = Math.floor(duration / 60)
                  const mins = duration % 60

                  return (
                    <tr key={shift.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: shift.color || '#3B82F6' }}
                        />
                      </td>
                      <td className="py-2 px-4 font-medium">{shift.name}</td>
                      <td className="py-2 px-4">{formatTime(shift.startTime)}</td>
                      <td className="py-2 px-4">{formatTime(shift.endTime)}</td>
                      <td className="py-2 px-4">
                        {hours}h {mins > 0 ? `${mins}m` : ''}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => handleEdit(shift)}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inactive Shifts */}
      {inactiveShifts.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-500">Inactive Shifts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full opacity-60">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Color</th>
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Start Time</th>
                  <th className="text-left py-2 px-4">End Time</th>
                </tr>
              </thead>
              <tbody>
                {inactiveShifts.map((shift) => (
                  <tr key={shift.id} className="border-b">
                    <td className="py-2 px-4">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: shift.color || '#3B82F6' }}
                      />
                    </td>
                    <td className="py-2 px-4">{shift.name}</td>
                    <td className="py-2 px-4">{formatTime(shift.startTime)}</td>
                    <td className="py-2 px-4">{formatTime(shift.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
