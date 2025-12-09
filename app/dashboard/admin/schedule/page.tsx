'use client'

import { useState, useEffect } from 'react'

interface ScheduleEntry {
  id: string
  userId: string | null
  userName: string | null
  shiftId: string
  shiftName: string
  rinkId: string
  rinkName: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  color: string
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string
}

interface Rink {
  id: string
  name: string
}

const mockRinks: Rink[] = [
  { id: 'rink-1', name: 'Rink A' },
  { id: 'rink-2', name: 'Rink B' },
]

const mockUsers = [
  { id: 'user-1', name: 'John Operator' },
  { id: 'user-2', name: 'Jane Smith' },
  { id: 'user-3', name: 'Bob Johnson' },
]

export default function AdminSchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [newEntry, setNewEntry] = useState({
    userId: '',
    shiftId: '',
    rinkId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    isOpenShift: false,
    isEmergency: false,
  })

  const [newShift, setNewShift] = useState({
    name: '',
    startTime: '06:00',
    endTime: '14:00',
    color: '#3B82F6',
  })

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function fetchData() {
    try {
      setLoading(true)
      const [scheduleRes, shiftsRes] = await Promise.all([
        fetch(`/api/schedule${statusFilter ? `?status=${statusFilter}` : ''}`),
        fetch('/api/shifts'),
      ])

      if (scheduleRes.ok) {
        const data = await scheduleRes.json()
        setEntries(data.entries)
      }
      if (shiftsRes.ok) {
        const data = await shiftsRes.json()
        setShifts(data.shifts)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createEntry() {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      })
      if (response.ok) {
        setShowNewEntryModal(false)
        setNewEntry({
          userId: '',
          shiftId: '',
          rinkId: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '06:00',
          endTime: '14:00',
          isOpenShift: false,
          isEmergency: false,
        })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create entry:', error)
    }
  }

  async function publishEntry(id: string) {
    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to publish entry:', error)
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Are you sure you want to delete this schedule entry?')) return
    try {
      const response = await fetch(`/api/schedule/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  async function createShift() {
    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShift),
      })
      if (response.ok) {
        setShowShiftModal(false)
        setNewShift({ name: '', startTime: '06:00', endTime: '14:00', color: '#3B82F6' })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create shift:', error)
    }
  }

  const draftEntries = entries.filter(e => e.status === 'DRAFT')
  const publishedEntries = entries.filter(e => e.status === 'PUBLISHED')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600 mt-1">Create and manage staff schedules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowShiftModal(true)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Manage Shifts
          </button>
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            + Add Schedule Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Draft Entries</p>
          <p className="text-2xl font-bold text-gray-900">{draftEntries.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600">{publishedEntries.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Open Shifts</p>
          <p className="text-2xl font-bold text-amber-600">{entries.filter(e => e.isOpenShift).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Shift Templates</p>
          <p className="text-2xl font-bold text-blue-600">{shifts.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="FILLED">Filled</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rink</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No schedule entries found
                </td>
              </tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-2 px-2 py-1 rounded text-sm font-medium text-white"
                      style={{ backgroundColor: entry.color }}
                    >
                      {entry.shiftName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {entry.rinkName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.isOpenShift ? (
                      <span className="text-amber-600 font-medium">⚠️ Open Shift</span>
                    ) : entry.isEmergency ? (
                      <span className="text-red-600 font-medium">🚨 {entry.userName || 'Emergency'}</span>
                    ) : (
                      <span className="text-gray-900">{entry.userName || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      entry.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      entry.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      entry.status === 'FILLED' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {entry.status === 'DRAFT' && (
                        <button
                          onClick={() => publishEntry(entry.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 text-sm rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Entry Modal */}
      {showNewEntryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Schedule Entry</h3>
              <button onClick={() => setShowNewEntryModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={e => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rink</label>
                  <select
                    value={newEntry.rinkId}
                    onChange={e => setNewEntry(prev => ({ ...prev, rinkId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rink...</option>
                    {mockRinks.map(rink => (
                      <option key={rink.id} value={rink.id}>{rink.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Template</label>
                <select
                  value={newEntry.shiftId}
                  onChange={e => {
                    const shift = shifts.find(s => s.id === e.target.value)
                    if (shift) {
                      setNewEntry(prev => ({
                        ...prev,
                        shiftId: e.target.value,
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                      }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select shift or custom...</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newEntry.startTime}
                    onChange={e => setNewEntry(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEntry.endTime}
                    onChange={e => setNewEntry(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newEntry.userId}
                  onChange={e => setNewEntry(prev => ({ ...prev, userId: e.target.value }))}
                  disabled={newEntry.isOpenShift}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select user...</option>
                  {mockUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEntry.isOpenShift}
                    onChange={e => setNewEntry(prev => ({ ...prev, isOpenShift: e.target.checked, userId: '' }))}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Open Shift (anyone can claim)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEntry.isEmergency}
                    onChange={e => setNewEntry(prev => ({ ...prev, isEmergency: e.target.checked }))}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Emergency Coverage</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createEntry}
                disabled={!newEntry.rinkId || !newEntry.date}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Templates Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Shift Templates</h3>
              <button onClick={() => setShowShiftModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3 mb-6">
                {shifts.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: shift.color }} />
                      <span className="font-medium">{shift.name}</span>
                      <span className="text-gray-500">{shift.startTime} - {shift.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="font-medium text-gray-900 mb-3">Add New Shift Template</h4>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Shift name"
                    value={newShift.name}
                    onChange={e => setNewShift(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={e => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={e => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="color"
                    value={newShift.color}
                    onChange={e => setNewShift(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <button
                  onClick={createShift}
                  disabled={!newShift.name}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Shift Template
                </button>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
