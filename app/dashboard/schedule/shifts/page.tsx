'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
  rinkId: string | null
  isActive: boolean
}

export default function ShiftsManagementPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null)

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/shifts')
      if (res.ok) {
        setShifts(await res.json())
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift definition?')) {
      return
    }

    try {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchShifts()
      } else {
        alert('Failed to delete shift')
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert('Failed to delete shift')
    }
  }

  const handleEdit = (shift: ShiftDefinition) => {
    setEditingShift(shift)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingShift(null)
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/schedule"
          className="text-blue-600 hover:underline"
        >
          &larr; Back to Schedule
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Definitions</h1>
          <p className="text-gray-600">
            Create and manage shift templates for scheduling
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary">
          Add Shift
        </button>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Loading shifts...</p>
        </div>
      ) : shifts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No shift definitions yet</p>
          <button onClick={handleAdd} className="btn-primary">
            Create Your First Shift
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="card border-l-4"
              style={{ borderLeftColor: shift.color || '#3B82F6' }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{shift.name}</h3>
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: shift.color || '#3B82F6' }}
                />
              </div>
              <p className="text-2xl font-mono text-gray-700 mb-4">
                {shift.startTime} - {shift.endTime}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(shift)}
                  className="flex-1 text-sm py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(shift.id)}
                  className="flex-1 text-sm py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ShiftModal
          shift={editingShift}
          onClose={() => {
            setShowModal(false)
            setEditingShift(null)
          }}
          onSuccess={() => {
            setShowModal(false)
            setEditingShift(null)
            fetchShifts()
          }}
        />
      )}
    </div>
  )
}

function ShiftModal({
  shift,
  onClose,
  onSuccess,
}: {
  shift: ShiftDefinition | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: shift?.name || '',
    startTime: shift?.startTime || '09:00',
    endTime: shift?.endTime || '17:00',
    color: shift?.color || '#3B82F6',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!shift

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const url = isEditing ? `/api/shifts/${shift.id}` : '/api/shifts'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save shift')
      }
    } catch (err) {
      setError('Failed to save shift')
    } finally {
      setSubmitting(false)
    }
  }

  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#6B7280', // Gray
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Shift' : 'Create New Shift'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Shift Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="input-field"
              placeholder="e.g., Morning, Evening, Overnight"
              required
            />
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
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color
                      ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
