'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string | null
  breakMinutes: number
  minEmployees: number
  maxEmployees: number | null
  description: string | null
  isActive: boolean
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    color: '#3B82F6',
    breakMinutes: 30,
    minEmployees: 1,
    maxEmployees: '',
    description: '',
  })

  useEffect(() => {
    fetchShifts()
  }, [])

  async function fetchShifts() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/schedule/shifts?activeOnly=false')
      if (response.ok) {
        const data = await response.json()
        setShifts(data.shifts)
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function openNewModal() {
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      color: '#3B82F6',
      breakMinutes: 30,
      minEmployees: 1,
      maxEmployees: '',
      description: '',
    })
    setShowModal(true)
  }

  function openEditModal(shift: ShiftDefinition) {
    setEditingShift(shift)
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      color: shift.color || '#3B82F6',
      breakMinutes: shift.breakMinutes,
      minEmployees: shift.minEmployees,
      maxEmployees: shift.maxEmployees?.toString() || '',
      description: shift.description || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const data = {
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        color: formData.color,
        breakMinutes: formData.breakMinutes,
        minEmployees: formData.minEmployees,
        maxEmployees: formData.maxEmployees ? parseInt(formData.maxEmployees) : null,
        description: formData.description || null,
      }

      const url = editingShift
        ? `/api/schedule/shifts/${editingShift.id}`
        : '/api/schedule/shifts'

      const response = await fetch(url, {
        method: editingShift ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to save shift')
        return
      }

      setShowModal(false)
      fetchShifts()
    } catch (error) {
      console.error('Error saving shift:', error)
      alert('Failed to save shift')
    }
  }

  async function handleDelete(shiftId: string) {
    if (!confirm('Are you sure you want to delete this shift template?')) return

    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to delete shift')
        return
      }

      fetchShifts()
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert('Failed to delete shift')
    }
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  function calculateDuration(startTime: string, endTime: string, breakMinutes: number) {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    if (totalMinutes < 0) totalMinutes += 24 * 60
    totalMinutes -= breakMinutes
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage reusable shift definitions for scheduling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/schedule" className="btn btn-secondary">
            &larr; Back to Schedule
          </Link>
          <button onClick={openNewModal} className="btn btn-primary">
            + New Shift
          </button>
        </div>
      </div>

      {/* Shifts List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : shifts.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500 mb-4">No shift templates found</p>
          <button onClick={openNewModal} className="btn btn-primary">
            Create Your First Shift
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className={`card border-l-4 ${!shift.isActive ? 'opacity-60' : ''}`}
              style={{ borderLeftColor: shift.color || '#3B82F6' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{shift.name}</div>
                  <div className="text-gray-600 mt-1">
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {calculateDuration(shift.startTime, shift.endTime, shift.breakMinutes)} (
                    {shift.breakMinutes}min break)
                  </div>
                </div>

                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: shift.color || '#3B82F6' }}
                />
              </div>

              <div className="mt-3 text-sm text-gray-600">
                Staff: {shift.minEmployees}
                {shift.maxEmployees && shift.maxEmployees !== shift.minEmployees
                  ? ` - ${shift.maxEmployees}`
                  : ''}
              </div>

              {shift.description && (
                <div className="mt-2 text-sm text-gray-500">
                  {shift.description}
                </div>
              )}

              {!shift.isActive && (
                <div className="mt-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                  Inactive
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t">
                <button
                  onClick={() => openEditModal(shift)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(shift.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingShift ? 'Edit Shift' : 'New Shift Template'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="e.g., Morning, Evening, Night..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="input w-full"
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Break (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.breakMinutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        breakMinutes: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="input w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Employees
                  </label>
                  <input
                    type="number"
                    value={formData.minEmployees}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minEmployees: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="input w-full"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Employees
                  </label>
                  <input
                    type="number"
                    value={formData.maxEmployees}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maxEmployees: e.target.value }))
                    }
                    className="input w-full"
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="input w-full"
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingShift ? 'Save Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
