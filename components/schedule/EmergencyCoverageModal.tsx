'use client'

import { useState, useEffect } from 'react'

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface EmergencyCoverageModalProps {
  onClose: () => void
  onSave: () => void
}

export default function EmergencyCoverageModal({
  onClose,
  onSave,
}: EmergencyCoverageModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shiftId: '',
    startTime: '',
    endTime: '',
    notes: '',
  })

  useEffect(() => {
    fetchShifts()
  }, [])

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
      // Create the emergency open shift
      const createRes = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          shiftId: formData.shiftId || undefined,
          startTime: formData.startTime,
          endTime: formData.endTime,
          isOpenShift: true,
          isEmergency: true,
        }),
      })

      const createData = await createRes.json()

      if (!createRes.ok) {
        setError(createData.error || 'Failed to create emergency request')
        return
      }

      // Immediately publish it
      const publishRes = await fetch(`/api/schedule/${createData.scheduleEntry.id}/publish`, {
        method: 'POST',
      })

      if (!publishRes.ok) {
        const publishData = await publishRes.json()
        setError(publishData.error || 'Created but failed to publish')
        return
      }

      onSave()
    } catch (err) {
      setError('Failed to create emergency request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-red-50">
          <h2 className="text-xl font-semibold text-red-800 flex items-center gap-2">
            🚨 Emergency Coverage Request
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>Important:</strong> This will immediately create and publish an emergency open shift.
            All employees will be notified immediately.
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Needed *
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
              Shift Type
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
            >
              {loading ? 'Sending...' : 'Send Emergency Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
