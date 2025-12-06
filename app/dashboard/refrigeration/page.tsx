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
}

const READING_TYPES = [
  { id: 'Hourly Check', label: 'Hourly Check', icon: '⏰' },
  { id: 'Compressor Log', label: 'Compressor Log', icon: '🔧' },
  { id: 'Brine Reading', label: 'Brine Reading', icon: '🧪' },
  { id: 'Pressure Check', label: 'Pressure Check', icon: '📊' },
  { id: 'Temperature Log', label: 'Temperature Log', icon: '🌡️' },
  { id: 'Maintenance', label: 'Maintenance', icon: '⚙️' }
]

export default function RefrigerationPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedRink, setSelectedRink] = useState('')
  const [readingType, setReadingType] = useState('')
  const [compressorTemp, setCompressorTemp] = useState('')
  const [suctionPressure, setSuctionPressure] = useState('')
  const [dischargePressure, setDischargePressure] = useState('')
  const [brineTemp, setBrineTemp] = useState('')
  const [brineLevel, setBrineLevel] = useState('')
  const [oilLevel, setOilLevel] = useState('')
  const [notes, setNotes] = useState('')

  // Filter state
  const [filterRink, setFilterRink] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterRink) params.set('rinkId', filterRink)
      if (filterDate) params.set('startDate', filterDate)

      const res = await fetch(`/api/refrigeration?${params}`)
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
    if (!selectedRink || !readingType) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/refrigeration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRink,
          readingType,
          data: {
            compressorTemp: compressorTemp ? parseFloat(compressorTemp) : null,
            suctionPressure: suctionPressure ? parseFloat(suctionPressure) : null,
            dischargePressure: dischargePressure ? parseFloat(dischargePressure) : null,
            brineTemp: brineTemp ? parseFloat(brineTemp) : null,
            brineLevel: brineLevel || null,
            oilLevel: oilLevel || null
          },
          notes
        })
      })

      if (res.ok) {
        setShowForm(false)
        resetForm()
        fetchData()
      } else {
        alert('Failed to save reading')
      }
    } catch (error) {
      alert('Failed to save reading')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedRink('')
    setReadingType('')
    setCompressorTemp('')
    setSuctionPressure('')
    setDischargePressure('')
    setBrineTemp('')
    setBrineLevel('')
    setOilLevel('')
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
          <h1 className="text-2xl font-bold text-gray-900">Refrigeration</h1>
          <p className="text-gray-600 mt-1">Track compressor readings and system health</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Log Reading
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {READING_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setReadingType(type.id)
              setShowForm(true)
            }}
            className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
          >
            <span className="text-2xl mb-1">{type.icon}</span>
            <span className="text-sm text-gray-700 text-center">{type.label}</span>
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

      {/* Readings Log */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Readings</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No readings logged yet. Click "Log Reading" to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => {
              const data = sub.data as Record<string, unknown>
              return (
                <div key={sub.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {READING_TYPES.find(t => t.id === sub.formTemplate.name)?.icon || '❄️'}
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
                  <div className="mt-2 ml-11 flex flex-wrap gap-4 text-sm">
                    {data.compressorTemp != null && (
                      <span className="text-gray-600">Comp: {String(data.compressorTemp)}°F</span>
                    )}
                    {data.suctionPressure != null && (
                      <span className="text-gray-600">Suction: {String(data.suctionPressure)} PSI</span>
                    )}
                    {data.dischargePressure != null && (
                      <span className="text-gray-600">Discharge: {String(data.dischargePressure)} PSI</span>
                    )}
                    {data.brineTemp != null && (
                      <span className="text-gray-600">Brine: {String(data.brineTemp)}°F</span>
                    )}
                  </div>
                  {data.notes != null && (
                    <div className="mt-1 text-sm text-gray-500 ml-11 italic">
                      {String(data.notes)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Log Reading Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Log Refrigeration Reading</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Reading Type *</label>
                <select
                  value={readingType}
                  onChange={(e) => setReadingType(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select type...</option>
                  {READING_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compressor Temp (°F)</label>
                  <input
                    type="number"
                    value={compressorTemp}
                    onChange={(e) => setCompressorTemp(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brine Temp (°F)</label>
                  <input
                    type="number"
                    value={brineTemp}
                    onChange={(e) => setBrineTemp(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suction Pressure (PSI)</label>
                  <input
                    type="number"
                    value={suctionPressure}
                    onChange={(e) => setSuctionPressure(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Pressure (PSI)</label>
                  <input
                    type="number"
                    value={dischargePressure}
                    onChange={(e) => setDischargePressure(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brine Level</label>
                  <select
                    value={brineLevel}
                    onChange={(e) => setBrineLevel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select...</option>
                    <option value="Full">Full</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oil Level</label>
                  <select
                    value={oilLevel}
                    onChange={(e) => setOilLevel(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select...</option>
                    <option value="Full">Full</option>
                    <option value="3/4">3/4</option>
                    <option value="1/2">1/2</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
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
                  disabled={submitting || !selectedRink || !readingType}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
