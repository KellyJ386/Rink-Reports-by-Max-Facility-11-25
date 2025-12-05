'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShiftDefinition, SHIFT_COLORS } from '@/types/schedule'

export default function ShiftManagementPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchShifts()
  }, [showInactive])

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/schedule/shifts?active=${!showInactive}`)
      if (response.ok) {
        const data = await response.json()
        setShifts(data)
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleShiftStatus = async (shiftId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        fetchShifts()
      }
    } catch (error) {
      console.error('Error toggling shift status:', error)
    }
  }

  const deleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift definition?')) {
      return
    }

    try {
      const response = await fetch(`/api/schedule/shifts/${shiftId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchShifts()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete shift')
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shift Definitions</h2>
          <p className="text-sm text-gray-500">Manage your facility&apos;s shift templates</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-blue-600"
            />
            Show Inactive
          </label>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Shift
          </button>
        </div>
      </div>

      {/* Shifts List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading shifts...</div>
      ) : shifts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shift Definitions</h3>
          <p className="text-gray-500 mb-4">
            Create shift templates to quickly schedule employees.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Shift
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shifts.map((shift) => (
                <tr key={shift.id} className={!shift.isActive ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: shift.color || '#3B82F6' }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{shift.name}</div>
                        {shift.description && (
                          <div className="text-sm text-gray-500">{shift.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{shift.startTime}</span>
                    <span className="text-gray-500 mx-1">-</span>
                    <span className="text-gray-900">{shift.endTime}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">
                      {shift.minStaffRequired} - {shift.maxStaffAllowed}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      shift.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {shift.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/admin/shifts/${shift.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleShiftStatus(shift.id, shift.isActive)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        {shift.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteShift(shift.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Shift Modal */}
      {showCreateModal && (
        <CreateShiftModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchShifts()
          }}
        />
      )}
    </div>
  )
}

interface CreateShiftModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateShiftModal({ onClose, onCreated }: CreateShiftModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [color, setColor] = useState('#3B82F6')
  const [minStaff, setMinStaff] = useState(1)
  const [maxStaff, setMaxStaff] = useState(3)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch('/api/schedule/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          startTime,
          endTime,
          color,
          minStaffRequired: minStaff,
          maxStaffAllowed: maxStaff
        })
      })

      if (response.ok) {
        onCreated()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create shift')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Create Shift Definition</h2>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning, Evening, Overnight"
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
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
