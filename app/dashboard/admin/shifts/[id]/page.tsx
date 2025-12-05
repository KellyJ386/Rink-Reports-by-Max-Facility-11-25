'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ShiftDefinition, SHIFT_COLORS } from '@/types/schedule'

export default function EditShiftPage() {
  const router = useRouter()
  const params = useParams()
  const shiftId = params.id as string

  const [shift, setShift] = useState<ShiftDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [minStaff, setMinStaff] = useState(1)
  const [maxStaff, setMaxStaff] = useState(3)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchShift()
  }, [shiftId])

  const fetchShift = async () => {
    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}`)
      if (response.ok) {
        const data = await response.json()
        setShift(data)
        // Populate form
        setName(data.name)
        setDescription(data.description || '')
        setStartTime(data.startTime)
        setEndTime(data.endTime)
        setColor(data.color || '#3B82F6')
        setMinStaff(data.minStaffRequired)
        setMaxStaff(data.maxStaffAllowed)
        setIsActive(data.isActive)
      } else {
        setError('Shift not found')
      }
    } catch (err) {
      setError('Failed to load shift')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          startTime,
          endTime,
          color,
          minStaffRequired: minStaff,
          maxStaffAllowed: maxStaff,
          isActive
        })
      })

      if (response.ok) {
        router.push('/dashboard/admin/shifts')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update shift')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading shift...</div>
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Shift Not Found</h3>
        <button
          onClick={() => router.push('/dashboard/admin/shifts')}
          className="text-blue-600 hover:underline"
        >
          Back to Shifts
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/admin/shifts')}
            className="text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Back to Shifts
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Edit Shift Definition</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Staff Required
                </label>
                <input
                  type="number"
                  value={minStaff}
                  onChange={(e) => setMinStaff(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Staff Allowed
                </label>
                <input
                  type="number"
                  value={maxStaff}
                  onChange={(e) => setMaxStaff(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {SHIFT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full ${
                      color === c.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-blue-600"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (visible for scheduling)
              </label>
            </div>
          </div>

          {/* Schedule Count Info */}
          {shift._count && (
            <div className="mt-6 pt-4 border-t text-sm text-gray-500">
              This shift is used in {(shift as any)._count.scheduleEntries} schedule entries.
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/shifts')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
