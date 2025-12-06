'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

interface Submission {
  id: string
  submittedAt: string
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
  formTemplate: { id: string; name: string }
  data: Record<string, unknown>
  outsideTemp: number | null
}

const OPERATION_TYPES = [
  { id: 'Resurfacing', label: 'Ice Resurfacing', icon: '🧊' },
  { id: 'Ice Cut', label: 'Ice Cut', icon: '🔪' },
  { id: 'Flood', label: 'Flood Only', icon: '💧' },
  { id: 'Ice Make', label: 'Ice Make', icon: '❄️' },
  { id: 'Circle Check', label: 'Circle Check', icon: '⭕' },
  { id: 'Edge Work', label: 'Edge Work', icon: '🔧' },
  { id: 'Blade Change', label: 'Blade Change', icon: '🔩' },
  { id: 'Paint/Lines', label: 'Paint/Lines', icon: '🎨' },
  { id: 'Maintenance', label: 'Machine Maintenance', icon: '⚙️' }
]

export default function IceOperationsPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedRink, setSelectedRink] = useState('')
  const [operationType, setOperationType] = useState('')
  const [duration, setDuration] = useState('')
  const [machineUsed, setMachineUsed] = useState('')
  const [waterTemp, setWaterTemp] = useState('')
  const [outsideTemp, setOutsideTemp] = useState('')
  const [notes, setNotes] = useState('')

  // Filter state
  const [filterRink, setFilterRink] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterRink) params.set('rinkId', filterRink)
      if (filterDate) params.set('startDate', filterDate)

      const res = await fetch(`/api/ice-operations?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRinks(data.rinks || [])
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterRink, filterDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRink || !operationType) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/ice-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRink,
          operationType,
          outsideTemp: outsideTemp || null,
          data: {
            duration: duration ? parseInt(duration) : null,
            machineUsed: machineUsed || null,
            waterTemp: waterTemp ? parseFloat(waterTemp) : null
          },
          notes
        })
      })

      if (res.ok) {
        setShowForm(false)
        resetForm()
        fetchData()
      } else {
        alert('Failed to save operation')
      }
    } catch (error) {
      alert('Failed to save operation')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedRink('')
    setOperationType('')
    setDuration('')
    setMachineUsed('')
    setWaterTemp('')
    setOutsideTemp('')
    setNotes('')
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ice Operations</h1>
          <p className="text-gray-600 mt-1">Track resurfacing, cuts, and maintenance</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Log Operation
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {OPERATION_TYPES.map((op) => (
          <button
            key={op.id}
            onClick={() => {
              setOperationType(op.id)
              setShowForm(true)
            }}
            className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
          >
            <span className="text-2xl mb-1">{op.icon}</span>
            <span className="text-sm text-gray-700 text-center">{op.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rink</label>
            <select
              value={filterRink}
              onChange={(e) => setFilterRink(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Rinks</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>{rink.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Operations Log */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Operations</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No operations logged yet. Click "Log Operation" to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => (
              <div key={sub.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {OPERATION_TYPES.find(o => o.id === sub.formTemplate.name)?.icon || '🧊'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">{sub.formTemplate.name}</div>
                      <div className="text-sm text-gray-500">
                        {sub.rink.name} • {sub.submittedBy.firstName} {sub.submittedBy.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatTime(sub.submittedAt)}</div>
                    <div className="text-sm text-gray-500">{formatDate(sub.submittedAt)}</div>
                  </div>
                </div>
                {(sub.data as Record<string, unknown>).duration != null && (
                  <div className="mt-2 text-sm text-gray-600 ml-11">
                    Duration: {String((sub.data as Record<string, unknown>).duration)} min
                    {(sub.data as Record<string, unknown>).machineUsed != null && ` • ${String((sub.data as Record<string, unknown>).machineUsed)}`}
                  </div>
                )}
                {(sub.data as Record<string, unknown>).notes != null && (
                  <div className="mt-1 text-sm text-gray-500 ml-11 italic">
                    {String((sub.data as Record<string, unknown>).notes)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Operation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Log Ice Operation</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rink *</label>
                <select
                  value={selectedRink}
                  onChange={(e) => setSelectedRink(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select rink...</option>
                  {rinks.map((rink) => (
                    <option key={rink.id} value={rink.id}>{rink.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type *</label>
                <select
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select type...</option>
                  {OPERATION_TYPES.map((op) => (
                    <option key={op.id} value={op.id}>{op.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Water Temp (°F)</label>
                  <input
                    type="number"
                    value={waterTemp}
                    onChange={(e) => setWaterTemp(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="140"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Machine/Equipment</label>
                <input
                  type="text"
                  value={machineUsed}
                  onChange={(e) => setMachineUsed(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Zamboni 552"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outside Temp (°F)</label>
                <input
                  type="number"
                  value={outsideTemp}
                  onChange={(e) => setOutsideTemp(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="32"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Any observations or issues..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRink || !operationType}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
