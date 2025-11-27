'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  firstName: string
  lastName: string
  role: { name: string }
}

interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface Rink {
  id: string
  name: string
}

export default function NewScheduleEntryPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    userId: '',
    shiftId: '',
    rinkId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    isOpenShift: false,
    isEmergency: false,
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-fill times when shift is selected
  useEffect(() => {
    if (formData.shiftId) {
      const shift = shifts.find((s) => s.id === formData.shiftId)
      if (shift) {
        setFormData((prev) => ({
          ...prev,
          startTime: shift.startTime,
          endTime: shift.endTime,
        }))
      }
    }
  }, [formData.shiftId, shifts])

  const fetchData = async () => {
    try {
      const [usersRes, shiftsRes, rinksRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/shifts'),
        fetch('/api/rinks'),
      ])

      const [usersData, shiftsData, rinksData] = await Promise.all([
        usersRes.json(),
        shiftsRes.json(),
        rinksRes.json(),
      ])

      if (usersRes.ok) setUsers(usersData.users || [])
      if (shiftsRes.ok) setShifts(shiftsData.shifts || [])
      if (rinksRes.ok) setRinks(rinksData.rinks || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.isOpenShift && !formData.userId) {
      setError('Please select a staff member or mark as open shift')
      return
    }

    if (!formData.date) {
      setError('Please select a date')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.isOpenShift ? null : formData.userId,
          shiftId: formData.shiftId || null,
          rinkId: formData.rinkId || null,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          isOpenShift: formData.isOpenShift,
          isEmergency: formData.isEmergency,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create schedule entry')
      }

      router.push('/dashboard/schedule')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule entry')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/schedule" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Shift</h1>
          <p className="text-gray-600 text-sm mt-1">Schedule a new shift assignment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Type */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isOpenShift}
                onChange={(e) => setFormData({ ...formData, isOpenShift: e.target.checked, userId: '' })}
                className="h-5 w-5 rounded border-gray-300 text-orange-600"
              />
              <div>
                <span className="font-medium text-gray-900">Open Shift</span>
                <p className="text-sm text-gray-500">Post as an open shift for staff to pick up</p>
              </div>
            </label>

            {!formData.isOpenShift && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="input"
                  required={!formData.isOpenShift}
                >
                  <option value="">Select staff member...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <label className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEmergency}
                onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
                className="h-5 w-5 rounded border-red-300 text-red-600"
              />
              <div>
                <span className="font-medium text-red-800">Emergency Coverage</span>
                <p className="text-sm text-red-600">Mark as urgent - will notify staff immediately</p>
              </div>
            </label>
          </div>
        </div>

        {/* Date and Time */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input"
                required
              />
            </div>

            {shifts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Template
                </label>
                <select
                  value={formData.shiftId}
                  onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
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
            )}

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
          </div>
        </div>

        {/* Location */}
        {rinks.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rink Assignment</label>
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
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Any special instructions or notes for this shift..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/schedule" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Creating...' : 'Create Shift'}
          </button>
        </div>
      </form>
    </div>
  )
}
