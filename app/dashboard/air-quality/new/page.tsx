'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

export default function NewAirQualityPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [formTemplateId, setFormTemplateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [alert, setAlert] = useState<{ type: 'warning' | 'danger'; message: string } | null>(null)

  const [formData, setFormData] = useState({
    rinkId: '',
    coPpm: '',
    no2Ppm: '',
    temperature: '',
    humidity: '',
    notes: '',
    resurfacerRunning: false,
    doorsOpen: false,
  })

  // Thresholds from settings
  const [thresholds, setThresholds] = useState({
    coWarning: 20,
    coEvacuation: 83,
    no2Warning: 0.3,
    no2Evacuation: 2.0,
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Check for alerts when values change
  useEffect(() => {
    const co = parseFloat(formData.coPpm)
    const no2 = parseFloat(formData.no2Ppm)

    if (!isNaN(co) && co >= thresholds.coEvacuation) {
      setAlert({ type: 'danger', message: `CO level ${co} ppm exceeds evacuation threshold (${thresholds.coEvacuation} ppm)! EVACUATE IMMEDIATELY!` })
    } else if (!isNaN(no2) && no2 >= thresholds.no2Evacuation) {
      setAlert({ type: 'danger', message: `NO2 level ${no2} ppm exceeds evacuation threshold (${thresholds.no2Evacuation} ppm)! EVACUATE IMMEDIATELY!` })
    } else if (!isNaN(co) && co >= thresholds.coWarning) {
      setAlert({ type: 'warning', message: `CO level ${co} ppm exceeds warning threshold (${thresholds.coWarning} ppm). Increase ventilation.` })
    } else if (!isNaN(no2) && no2 >= thresholds.no2Warning) {
      setAlert({ type: 'warning', message: `NO2 level ${no2} ppm exceeds warning threshold (${thresholds.no2Warning} ppm). Increase ventilation.` })
    } else {
      setAlert(null)
    }
  }, [formData.coPpm, formData.no2Ppm, thresholds])

  const fetchInitialData = async () => {
    try {
      // Fetch rinks, form template, and settings in parallel
      const [rinksRes, formsRes, settingsRes] = await Promise.all([
        fetch('/api/rinks'),
        fetch('/api/forms?moduleType=AIR_QUALITY'),
        fetch('/api/settings'),
      ])

      if (rinksRes.ok) {
        const rinksData = await rinksRes.json()
        setRinks(rinksData.rinks)
        if (rinksData.rinks.length === 1) {
          setFormData((prev) => ({ ...prev, rinkId: rinksData.rinks[0].id }))
        }
      } else {
        setError('Failed to load rinks')
      }

      if (formsRes.ok) {
        const formsData = await formsRes.json()
        if (formsData.forms && formsData.forms.length > 0) {
          setFormTemplateId(formsData.forms[0].id)
        }
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.settings) {
          setThresholds({
            coWarning: settingsData.settings.coWarningPpm ?? 20,
            coEvacuation: settingsData.settings.coEvacuationPpm ?? 83,
            no2Warning: settingsData.settings.no2WarningPpm ?? 0.3,
            no2Evacuation: settingsData.settings.no2EvacuationPpm ?? 2.0,
          })
        }
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.rinkId) {
      setError('Please select a rink')
      return
    }

    if (!formData.coPpm && !formData.no2Ppm) {
      setError('Please enter at least one measurement')
      return
    }

    if (!formTemplateId) {
      setError('No form template configured for air quality. Please contact an administrator.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId,
          rinkId: formData.rinkId,
          data: {
            coPpm: formData.coPpm ? parseFloat(formData.coPpm) : null,
            no2Ppm: formData.no2Ppm ? parseFloat(formData.no2Ppm) : null,
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            humidity: formData.humidity ? parseFloat(formData.humidity) : null,
            resurfacerRunning: formData.resurfacerRunning,
            doorsOpen: formData.doorsOpen,
            notes: formData.notes,
            alertTriggered: alert !== null,
            alertType: alert?.type || null,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/dashboard/air-quality')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
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
        <Link href="/dashboard/air-quality" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Air Quality Reading</h1>
          <p className="text-gray-600 text-sm mt-1">Record CO and NO2 measurements</p>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 mb-6 rounded-lg ${alert.type === 'danger' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-yellow-100 border-l-4 border-yellow-500'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{alert.type === 'danger' ? '🚨' : '⚠️'}</span>
            <div>
              <h3 className={`font-semibold ${alert.type === 'danger' ? 'text-red-800' : 'text-yellow-800'}`}>
                {alert.type === 'danger' ? 'EVACUATION REQUIRED' : 'Warning'}
              </h3>
              <p className={`text-sm ${alert.type === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rink <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.rinkId}
              onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select rink...</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>{rink.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurements</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carbon Monoxide (CO)
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.coPpm}
                  onChange={(e) => setFormData({ ...formData, coPpm: e.target.value })}
                  className={`input rounded-r-none ${parseFloat(formData.coPpm) >= thresholds.coWarning ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="0.0"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">ppm</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Warning: {thresholds.coWarning} | Evacuate: {thresholds.coEvacuation}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nitrogen Dioxide (NO2)
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.no2Ppm}
                  onChange={(e) => setFormData({ ...formData, no2Ppm: e.target.value })}
                  className={`input rounded-r-none ${parseFloat(formData.no2Ppm) >= thresholds.no2Warning ? 'border-red-500 bg-red-50' : ''}`}
                  placeholder="0.00"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">ppm</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Warning: {thresholds.no2Warning} | Evacuate: {thresholds.no2Evacuation}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Conditions</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <div className="flex">
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">°F</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Humidity</label>
              <div className="flex">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.resurfacerRunning}
                onChange={(e) => setFormData({ ...formData, resurfacerRunning: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Resurfacer was running during reading</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.doorsOpen}
                onChange={(e) => setFormData({ ...formData, doorsOpen: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Doors/vents were open</span>
            </label>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Any observations or actions taken..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/air-quality" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Reading'}
          </button>
        </div>
      </form>
    </div>
  )
}
