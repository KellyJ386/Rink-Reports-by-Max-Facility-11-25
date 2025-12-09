'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ScheduleEntry {
  id: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  notes: string | null
  userId: string | null
  createdById: string
  shiftId: string | null
  rinkId: string | null
  user: {
    id: string
    firstName: string
    lastName: string
  } | null
  rink?: {
    id: string
    name: string
  } | null
  shift?: {
    id: string
    name: string
  } | null
}

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

interface CurrentUser {
  id: string
  role: {
    permissions: {
      schedule?: {
        edit?: boolean
        delete?: boolean
      }
    }
  }
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default function ScheduleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const entryId = params.id as string

  const [entry, setEntry] = useState<ScheduleEntry | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    userId: '',
    shiftId: '',
    rinkId: '',
    date: '',
    startTime: '',
    endTime: '',
    isOpenShift: false,
    isEmergency: false,
    notes: '',
    status: '',
  })

  useEffect(() => {
    fetchData()
  }, [entryId])

  const fetchData = async () => {
    try {
      const [entryRes, usersRes, shiftsRes, rinksRes, meRes] = await Promise.all([
        fetch(`/api/schedule/${entryId}`),
        fetch('/api/users'),
        fetch('/api/shifts'),
        fetch('/api/rinks'),
        fetch('/api/auth/me'),
      ])

      const [entryData, usersData, shiftsData, rinksData, meData] = await Promise.all([
        entryRes.json(),
        usersRes.json(),
        shiftsRes.json(),
        rinksRes.json(),
        meRes.json(),
      ])

      if (!entryRes.ok) {
        throw new Error(entryData.error || 'Failed to load schedule entry')
      }

      setEntry(entryData.entry)
      setUsers(usersData.users || [])
      setShifts(shiftsData.shifts || [])
      setRinks(rinksData.rinks || [])
      setCurrentUser(meData.user || null)

      // Initialize form data
      const e = entryData.entry
      setFormData({
        userId: e.userId || '',
        shiftId: e.shiftId || '',
        rinkId: e.rinkId || '',
        date: e.date.split('T')[0],
        startTime: e.startTime,
        endTime: e.endTime,
        isOpenShift: e.isOpenShift,
        isEmergency: e.isEmergency,
        notes: e.notes || '',
        status: e.status,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.isOpenShift && !formData.userId) {
      setError('Please select a staff member or mark as open shift')
      return
    }

    // Validate end time is after start time
    if (formData.endTime <= formData.startTime) {
      setError('End time must be after start time')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/schedule/${entryId}`, {
        method: 'PATCH',
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
          notes: formData.notes || null,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setEntry(data.entry)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (entry) {
      setFormData({
        userId: entry.userId || '',
        shiftId: entry.shiftId || '',
        rinkId: entry.rinkId || '',
        date: entry.date.split('T')[0],
        startTime: entry.startTime,
        endTime: entry.endTime,
        isOpenShift: entry.isOpenShift,
        isEmergency: entry.isEmergency,
        notes: entry.notes || '',
        status: entry.status,
      })
    }
    setIsEditing(false)
    setError('')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/schedule/${entryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      router.push('/dashboard/schedule')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Auto-fill times when shift template is selected (in edit mode)
  useEffect(() => {
    if (isEditing && formData.shiftId) {
      const shift = shifts.find((s) => s.id === formData.shiftId)
      if (shift) {
        setFormData((prev) => ({
          ...prev,
          startTime: shift.startTime,
          endTime: shift.endTime,
        }))
      }
    }
  }, [formData.shiftId, shifts, isEditing])

  const canEdit = currentUser?.role?.permissions?.schedule?.edit || entry?.createdById === currentUser?.id
  const canDelete = currentUser?.role?.permissions?.schedule?.delete || entry?.createdById === currentUser?.id

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !entry) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-500 text-5xl mb-4">Error</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Shift</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/dashboard/schedule" className="btn btn-secondary">
          Back to Schedule
        </Link>
      </div>
    )
  }

  if (!entry) return null

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/schedule" className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Details</h1>
            <p className="text-gray-600 text-sm mt-1">
              {new Date(entry.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
              Edit
            </button>
            {canDelete && (
              <button onClick={handleDelete} className="btn btn-secondary text-red-600 hover:bg-red-50">
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {isEditing ? (
        // Edit Mode
        <div className="space-y-6">
          {/* Assignment */}
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
                  <p className="text-sm text-red-600">Mark as urgent</p>
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

          {/* Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="FILLED">Filled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button onClick={handleCancel} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <div className="space-y-6">
          {/* Status Badge */}
          {(entry.isOpenShift || entry.isEmergency) && (
            <div className="flex gap-2">
              {entry.isOpenShift && entry.status !== 'FILLED' && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  Open Shift
                </span>
              )}
              {entry.isEmergency && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Emergency
                </span>
              )}
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Assigned To</div>
              <div className="font-semibold text-gray-900">
                {entry.isOpenShift && entry.status !== 'FILLED'
                  ? 'Open - Not Assigned'
                  : entry.user
                  ? `${entry.user.firstName} ${entry.user.lastName}`
                  : 'Not Assigned'}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                entry.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                entry.status === 'FILLED' ? 'bg-blue-100 text-blue-800' :
                entry.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {entry.status}
              </span>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Time</div>
              <div className="font-semibold text-gray-900">
                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Location</div>
              <div className="font-semibold text-gray-900">
                {entry.rink?.name || 'All Rinks / Facility-wide'}
              </div>
            </div>
          </div>

          {/* Shift Template */}
          {entry.shift && (
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Shift Template</div>
              <div className="font-semibold text-gray-900">{entry.shift.name}</div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{entry.notes}</p>
            </div>
          )}

          {/* Pick Up Shift Button */}
          {entry.isOpenShift && entry.status !== 'FILLED' && (
            <div className="card bg-orange-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-800">This shift needs coverage</h3>
                  <p className="text-sm text-orange-600">Click to assign this shift to yourself</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Are you sure you want to pick up this shift?')) return
                    try {
                      const response = await fetch(`/api/schedule/${entryId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'pickup' }),
                      })
                      if (response.ok) {
                        fetchData()
                      } else {
                        const data = await response.json()
                        setError(data.error || 'Failed to pick up shift')
                      }
                    } catch {
                      setError('Failed to pick up shift')
                    }
                  }}
                  className="btn btn-primary bg-orange-600 hover:bg-orange-700"
                >
                  Pick Up Shift
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
