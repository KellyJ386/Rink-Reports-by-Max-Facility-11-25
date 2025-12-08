'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AvailabilitySlot {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
  preferenceLevel: 'PREFERRED' | 'AVAILABLE' | 'UNAVAILABLE'
  notes?: string | null
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const PREFERENCE_STYLES = {
  PREFERRED: 'bg-green-100 border-green-400 text-green-700',
  AVAILABLE: 'bg-blue-100 border-blue-400 text-blue-700',
  UNAVAILABLE: 'bg-red-100 border-red-400 text-red-700',
}

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editData, setEditData] = useState<AvailabilitySlot>({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
    preferenceLevel: 'AVAILABLE',
    notes: '',
  })

  useEffect(() => {
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/schedule/availability')
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true)
      const response = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to save availability')
        return
      }

      alert('Availability saved successfully')
      fetchAvailability()
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Failed to save availability')
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditDay(dayOfWeek: number) {
    const daySlots = availability.filter((a) => a.dayOfWeek === dayOfWeek)
    if (daySlots.length > 0) {
      setEditData({
        ...daySlots[0],
        dayOfWeek,
      })
    } else {
      setEditData({
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        preferenceLevel: 'AVAILABLE',
        notes: '',
      })
    }
    setEditingDay(dayOfWeek)
    setShowEditModal(true)
  }

  function handleSaveSlot() {
    setAvailability((prev) => {
      // Remove existing slots for this day
      const filtered = prev.filter((a) => a.dayOfWeek !== editData.dayOfWeek)
      // Add the new slot
      return [...filtered, editData].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    })
    setShowEditModal(false)
    setEditingDay(null)
  }

  function handleRemoveSlot(dayOfWeek: number) {
    setAvailability((prev) => prev.filter((a) => a.dayOfWeek !== dayOfWeek))
  }

  function formatTime(time: string) {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  // Group availability by day
  const availabilityByDay = new Map<number, AvailabilitySlot[]>()
  for (const slot of availability) {
    const existing = availabilityByDay.get(slot.dayOfWeek) || []
    existing.push(slot)
    availabilityByDay.set(slot.dayOfWeek, existing)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Availability</h1>
          <p className="text-gray-600 mt-1">
            Set your weekly availability and preferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/schedule" className="btn btn-secondary">
            &larr; Back to Schedule
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-green-100 border border-green-400"></span>
          <span>Preferred</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-blue-100 border border-blue-400"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-red-100 border border-red-400"></span>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Availability Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DAYS.map((day, index) => {
            const daySlots = availabilityByDay.get(index) || []
            const hasSlot = daySlots.length > 0
            const slot = daySlots[0]

            return (
              <div
                key={index}
                className={`card cursor-pointer hover:shadow-md transition-shadow ${
                  hasSlot
                    ? `border-l-4 ${PREFERENCE_STYLES[slot.preferenceLevel]}`
                    : 'border-l-4 border-gray-200'
                }`}
                onClick={() => handleEditDay(index)}
              >
                <div className="font-medium mb-2">{day}</div>

                {hasSlot ? (
                  <div>
                    <div className="text-sm">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                    <div className="text-xs mt-1 capitalize">
                      {slot.preferenceLevel.toLowerCase().replace('_', ' ')}
                    </div>
                    {slot.notes && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {slot.notes}
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSlot(index)
                      }}
                      className="text-xs text-red-500 hover:text-red-700 mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    Click to set availability
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingDay !== null && DAYS[editingDay]} Availability
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editData.startTime}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editData.endTime}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preference
                </label>
                <select
                  value={editData.preferenceLevel}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      preferenceLevel: e.target.value as any,
                      isAvailable: e.target.value !== 'UNAVAILABLE',
                    }))
                  }
                  className="input w-full"
                >
                  <option value="PREFERRED">Preferred - I want to work</option>
                  <option value="AVAILABLE">Available - I can work</option>
                  <option value="UNAVAILABLE">Unavailable - Cannot work</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={editData.notes || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="input w-full"
                  placeholder="e.g., No evenings, prefer mornings..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingDay(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleSaveSlot} className="btn btn-primary">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
