'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

interface Thresholds {
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
}

interface Submission {
  id: string
  submittedAt: string
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
  formTemplate: { id: string; name: string }
  data: Record<string, unknown>
}

export default function AirQualityPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [thresholds, setThresholds] = useState<Thresholds>({
    coWarningPpm: 20,
    coEvacuationPpm: 83,
    no2WarningPpm: 0.3,
    no2EvacuationPpm: 2.0
  })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedRink, setSelectedRink] = useState('')
  const [coPpm, setCoPpm] = useState('')
  const [no2Ppm, setNo2Ppm] = useState('')
  const [temperature, setTemperature] = useState('')
  const [humidity, setHumidity] = useState('')
  const [notes, setNotes] = useState('')

  // Filter state
  const [filterRink, setFilterRink] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterRink) params.set('rinkId', filterRink)
      if (filterDate) params.set('startDate', filterDate)

      const res = await fetch(`/api/air-quality?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRinks(data.rinks || [])
        setSubmissions(data.submissions || [])
        if (data.thresholds) setThresholds(data.thresholds)
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

  const getAlertLevel = (co: number | null, no2: number | null): 'normal' | 'warning' | 'evacuation' => {
    if ((co && co >= thresholds.coEvacuationPpm) || (no2 && no2 >= thresholds.no2EvacuationPpm)) {
      return 'evacuation'
    }
    if ((co && co >= thresholds.coWarningPpm) || (no2 && no2 >= thresholds.no2WarningPpm)) {
      return 'warning'
    }
    return 'normal'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRink) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/air-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRink,
          readingType: 'Air Quality Reading',
          data: {
            coPpm: coPpm ? parseFloat(coPpm) : null,
            no2Ppm: no2Ppm ? parseFloat(no2Ppm) : null,
            temperature: temperature ? parseFloat(temperature) : null,
            humidity: humidity ? parseFloat(humidity) : null
          },
          notes
        })
      })

      if (res.ok) {
        const result = await res.json()
        if (result.alertLevel === 'evacuation') {
          alert('⚠️ EVACUATION LEVEL DETECTED - Take immediate action!')
        } else if (result.alertLevel === 'warning') {
          alert('⚠️ Warning level detected - Monitor closely')
        }
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
    setCoPpm('')
    setNo2Ppm('')
    setTemperature('')
    setHumidity('')
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
          <h1 className="text-2xl font-bold text-gray-900">Air Quality</h1>
          <p className="text-gray-600 mt-1">Monitor CO and NO2 levels</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Log Reading
        </button>
      </div>

      {/* Threshold Reference */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-3">Alert Thresholds</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-800 font-medium">CO Warning</div>
            <div className="text-yellow-700">{thresholds.coWarningPpm} PPM</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-800 font-medium">CO Evacuation</div>
            <div className="text-red-700">{thresholds.coEvacuationPpm} PPM</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-yellow-800 font-medium">NO2 Warning</div>
            <div className="text-yellow-700">{thresholds.no2WarningPpm} PPM</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-red-800 font-medium">NO2 Evacuation</div>
            <div className="text-red-700">{thresholds.no2EvacuationPpm} PPM</div>
          </div>
        </div>
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
              const co = data.coPpm ? Number(data.coPpm) : null
              const no2 = data.no2Ppm ? Number(data.no2Ppm) : null
              const alertLevel = data.alertLevel as string || getAlertLevel(co, no2)

              const alertStyles = {
                normal: 'bg-green-50 border-green-200',
                warning: 'bg-yellow-50 border-yellow-200',
                evacuation: 'bg-red-50 border-red-200'
              }

              return (
                <div key={sub.id} className={`px-4 py-3 ${alertLevel !== 'normal' ? alertStyles[alertLevel as keyof typeof alertStyles] : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {alertLevel === 'evacuation' ? '🚨' : alertLevel === 'warning' ? '⚠️' : '🌡️'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {sub.rink.name}
                          {alertLevel !== 'normal' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              alertLevel === 'evacuation' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                            }`}>
                              {alertLevel.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sub.submittedBy.firstName} {sub.submittedBy.lastName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{formatTime(sub.submittedAt)}</div>
                      <div className="text-sm text-gray-500">{formatDate(sub.submittedAt)}</div>
                    </div>
                  </div>
                  <div className="mt-2 ml-11 flex flex-wrap gap-4 text-sm">
                    {co !== null && (
                      <span className={co >= thresholds.coEvacuationPpm ? 'text-red-700 font-bold' : co >= thresholds.coWarningPpm ? 'text-yellow-700 font-medium' : 'text-gray-600'}>
                        CO: {co} PPM
                      </span>
                    )}
                    {no2 !== null && (
                      <span className={no2 >= thresholds.no2EvacuationPpm ? 'text-red-700 font-bold' : no2 >= thresholds.no2WarningPpm ? 'text-yellow-700 font-medium' : 'text-gray-600'}>
                        NO2: {no2} PPM
                      </span>
                    )}
                    {data.temperature != null && (
                      <span className="text-gray-600">Temp: {String(data.temperature)}°F</span>
                    )}
                    {data.humidity != null && (
                      <span className="text-gray-600">Humidity: {String(data.humidity)}%</span>
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
              <h2 className="font-semibold text-gray-900">Log Air Quality Reading</h2>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CO (PPM)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={coPpm}
                    onChange={(e) => setCoPpm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.0"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Warning: {thresholds.coWarningPpm} | Evac: {thresholds.coEvacuationPpm}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NO2 (PPM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={no2Ppm}
                    onChange={(e) => setNo2Ppm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Warning: {thresholds.no2WarningPpm} | Evac: {thresholds.no2EvacuationPpm}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Any observations..."
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
                  disabled={submitting || !selectedRink}
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
