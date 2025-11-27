'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

// Normal operating ranges
const RANGES = {
  suctionPressure: { min: 20, max: 40, unit: 'PSI', label: 'Suction Pressure' },
  dischargePressure: { min: 150, max: 250, unit: 'PSI', label: 'Discharge Pressure' },
  brineTemp: { min: 18, max: 24, unit: '°F', label: 'Brine Temperature' },
  brineReturnTemp: { min: 20, max: 26, unit: '°F', label: 'Brine Return Temp' },
  compressorAmps: { min: 50, max: 150, unit: 'A', label: 'Compressor Amps' },
  oilPressure: { min: 40, max: 80, unit: 'PSI', label: 'Oil Pressure' },
  condenserTemp: { min: 85, max: 105, unit: '°F', label: 'Condenser Temp' },
}

function getWarningLevel(value: number, min: number, max: number): 'normal' | 'warning' | 'critical' | null {
  if (isNaN(value)) return null
  if (value < min * 0.9 || value > max * 1.1) return 'critical'
  if (value < min || value > max) return 'warning'
  return 'normal'
}

export default function NewRefrigerationPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  const [formData, setFormData] = useState({
    rinkId: '',
    // Compressor readings
    compressor1Running: true,
    compressor2Running: false,
    compressorAmps: '',
    suctionPressure: '',
    dischargePressure: '',
    oilPressure: '',
    oilLevel: 'normal',
    // Temperatures
    brineTemp: '',
    brineReturnTemp: '',
    condenserTemp: '',
    condenserWaterIn: '',
    condenserWaterOut: '',
    // Levels and misc
    refrigerantLevel: 'normal',
    sightGlass: 'clear',
    abnormalNoise: false,
    abnormalVibration: false,
    leaksDetected: false,
    leakLocation: '',
    // Maintenance
    maintenanceRequired: false,
    maintenanceNotes: '',
    notes: '',
  })

  useEffect(() => {
    fetchRinks()
  }, [])

  // Check for warnings when values change
  useEffect(() => {
    const newWarnings: string[] = []

    const suction = parseFloat(formData.suctionPressure)
    const discharge = parseFloat(formData.dischargePressure)
    const brine = parseFloat(formData.brineTemp)
    const amps = parseFloat(formData.compressorAmps)

    if (getWarningLevel(suction, RANGES.suctionPressure.min, RANGES.suctionPressure.max) === 'critical') {
      newWarnings.push(`Suction pressure ${suction} PSI is critically out of range (${RANGES.suctionPressure.min}-${RANGES.suctionPressure.max})`)
    } else if (getWarningLevel(suction, RANGES.suctionPressure.min, RANGES.suctionPressure.max) === 'warning') {
      newWarnings.push(`Suction pressure ${suction} PSI is outside normal range`)
    }

    if (getWarningLevel(discharge, RANGES.dischargePressure.min, RANGES.dischargePressure.max) === 'critical') {
      newWarnings.push(`Discharge pressure ${discharge} PSI is critically out of range (${RANGES.dischargePressure.min}-${RANGES.dischargePressure.max})`)
    } else if (getWarningLevel(discharge, RANGES.dischargePressure.min, RANGES.dischargePressure.max) === 'warning') {
      newWarnings.push(`Discharge pressure ${discharge} PSI is outside normal range`)
    }

    if (getWarningLevel(brine, RANGES.brineTemp.min, RANGES.brineTemp.max) === 'critical') {
      newWarnings.push(`Brine temperature ${brine}°F is critically out of range (${RANGES.brineTemp.min}-${RANGES.brineTemp.max})`)
    } else if (getWarningLevel(brine, RANGES.brineTemp.min, RANGES.brineTemp.max) === 'warning') {
      newWarnings.push(`Brine temperature ${brine}°F is outside normal range`)
    }

    if (formData.leaksDetected) {
      newWarnings.push('Refrigerant leak detected - requires immediate attention')
    }

    if (formData.abnormalNoise || formData.abnormalVibration) {
      newWarnings.push('Abnormal noise/vibration detected - schedule inspection')
    }

    setWarnings(newWarnings)
  }, [formData])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/rinks')
      const data = await response.json()
      if (response.ok) {
        setRinks(data.rinks)
        if (data.rinks.length === 1) {
          setFormData((prev) => ({ ...prev, rinkId: data.rinks[0].id }))
        }
      }
    } catch (err) {
      setError('Failed to load rinks')
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

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: 'refrigeration-default',
          rinkId: formData.rinkId,
          data: {
            compressor1Running: formData.compressor1Running,
            compressor2Running: formData.compressor2Running,
            compressorAmps: formData.compressorAmps ? parseFloat(formData.compressorAmps) : null,
            suctionPressure: formData.suctionPressure ? parseFloat(formData.suctionPressure) : null,
            dischargePressure: formData.dischargePressure ? parseFloat(formData.dischargePressure) : null,
            oilPressure: formData.oilPressure ? parseFloat(formData.oilPressure) : null,
            oilLevel: formData.oilLevel,
            brineTemp: formData.brineTemp ? parseFloat(formData.brineTemp) : null,
            brineReturnTemp: formData.brineReturnTemp ? parseFloat(formData.brineReturnTemp) : null,
            condenserTemp: formData.condenserTemp ? parseFloat(formData.condenserTemp) : null,
            condenserWaterIn: formData.condenserWaterIn ? parseFloat(formData.condenserWaterIn) : null,
            condenserWaterOut: formData.condenserWaterOut ? parseFloat(formData.condenserWaterOut) : null,
            refrigerantLevel: formData.refrigerantLevel,
            sightGlass: formData.sightGlass,
            abnormalNoise: formData.abnormalNoise,
            abnormalVibration: formData.abnormalVibration,
            leaksDetected: formData.leaksDetected,
            leakLocation: formData.leakLocation,
            maintenanceRequired: formData.maintenanceRequired,
            maintenanceNotes: formData.maintenanceNotes,
            notes: formData.notes,
            alertsTriggered: warnings.length > 0,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/dashboard/refrigeration')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const getInputClass = (field: keyof typeof RANGES, value: string) => {
    const numValue = parseFloat(value)
    const range = RANGES[field]
    if (!range || isNaN(numValue)) return 'input'

    const level = getWarningLevel(numValue, range.min, range.max)
    if (level === 'critical') return 'input border-red-500 bg-red-50'
    if (level === 'warning') return 'input border-yellow-500 bg-yellow-50'
    return 'input border-green-500 bg-green-50'
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/refrigeration" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Refrigeration Reading</h1>
          <p className="text-gray-600 text-sm mt-1">Record compressor and system readings</p>
        </div>
      </div>

      {/* Warning Banner */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800">System Warnings</h3>
              <ul className="text-yellow-700 text-sm mt-1 list-disc list-inside">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
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

        {/* Compressor Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compressor Status</h2>
          <div className="space-y-4">
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.compressor1Running}
                  onChange={(e) => setFormData({ ...formData, compressor1Running: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Compressor #1 Running</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.compressor2Running}
                  onChange={(e) => setFormData({ ...formData, compressor2Running: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Compressor #2 Running</span>
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suction Pressure</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.suctionPressure}
                    onChange={(e) => setFormData({ ...formData, suctionPressure: e.target.value })}
                    className={`${getInputClass('suctionPressure', formData.suctionPressure)} rounded-r-none`}
                    placeholder="--"
                  />
                  <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">PSI</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Normal: {RANGES.suctionPressure.min}-{RANGES.suctionPressure.max}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Pressure</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.dischargePressure}
                    onChange={(e) => setFormData({ ...formData, dischargePressure: e.target.value })}
                    className={`${getInputClass('dischargePressure', formData.dischargePressure)} rounded-r-none`}
                    placeholder="--"
                  />
                  <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">PSI</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Normal: {RANGES.dischargePressure.min}-{RANGES.dischargePressure.max}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oil Pressure</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.oilPressure}
                    onChange={(e) => setFormData({ ...formData, oilPressure: e.target.value })}
                    className={`${getInputClass('oilPressure', formData.oilPressure)} rounded-r-none`}
                    placeholder="--"
                  />
                  <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">PSI</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compressor Amps</label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.compressorAmps}
                    onChange={(e) => setFormData({ ...formData, compressorAmps: e.target.value })}
                    className={`${getInputClass('compressorAmps', formData.compressorAmps)} rounded-r-none`}
                    placeholder="--"
                  />
                  <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">A</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Oil Level</label>
              <select
                value={formData.oilLevel}
                onChange={(e) => setFormData({ ...formData, oilLevel: e.target.value })}
                className="input w-auto"
              >
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Temperatures */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Temperatures</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brine Supply Temp</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.1"
                  value={formData.brineTemp}
                  onChange={(e) => setFormData({ ...formData, brineTemp: e.target.value })}
                  className={`${getInputClass('brineTemp', formData.brineTemp)} rounded-r-none`}
                  placeholder="--"
                />
                <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Normal: {RANGES.brineTemp.min}-{RANGES.brineTemp.max}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brine Return Temp</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.1"
                  value={formData.brineReturnTemp}
                  onChange={(e) => setFormData({ ...formData, brineReturnTemp: e.target.value })}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condenser Temp</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.1"
                  value={formData.condenserTemp}
                  onChange={(e) => setFormData({ ...formData, condenserTemp: e.target.value })}
                  className={`${getInputClass('condenserTemp', formData.condenserTemp)} rounded-r-none`}
                  placeholder="--"
                />
                <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condenser Water In</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.1"
                  value={formData.condenserWaterIn}
                  onChange={(e) => setFormData({ ...formData, condenserWaterIn: e.target.value })}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condenser Water Out</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.1"
                  value={formData.condenserWaterOut}
                  onChange={(e) => setFormData({ ...formData, condenserWaterOut: e.target.value })}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Checks */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Checks</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refrigerant Level</label>
              <select
                value={formData.refrigerantLevel}
                onChange={(e) => setFormData({ ...formData, refrigerantLevel: e.target.value })}
                className="input"
              >
                <option value="normal">Normal</option>
                <option value="low">Low</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sight Glass</label>
              <select
                value={formData.sightGlass}
                onChange={(e) => setFormData({ ...formData, sightGlass: e.target.value })}
                className="input"
              >
                <option value="clear">Clear</option>
                <option value="bubbles">Bubbles Present</option>
                <option value="cloudy">Cloudy</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.abnormalNoise}
                onChange={(e) => setFormData({ ...formData, abnormalNoise: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Abnormal Noise Detected</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.abnormalVibration}
                onChange={(e) => setFormData({ ...formData, abnormalVibration: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Abnormal Vibration Detected</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-red-50 rounded">
              <input
                type="checkbox"
                checked={formData.leaksDetected}
                onChange={(e) => setFormData({ ...formData, leaksDetected: e.target.checked })}
                className="h-4 w-4 rounded border-red-300 text-red-600"
              />
              <span className="text-sm text-red-700 font-medium">Refrigerant Leak Detected</span>
            </label>
            {formData.leaksDetected && (
              <div className="ml-6">
                <input
                  type="text"
                  value={formData.leakLocation}
                  onChange={(e) => setFormData({ ...formData, leakLocation: e.target.value })}
                  className="input"
                  placeholder="Describe leak location..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Maintenance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h2>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={formData.maintenanceRequired}
              onChange={(e) => setFormData({ ...formData, maintenanceRequired: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Maintenance Required</span>
          </label>
          {formData.maintenanceRequired && (
            <textarea
              value={formData.maintenanceNotes}
              onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
              className="input"
              rows={2}
              placeholder="Describe maintenance needed..."
            />
          )}
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Any additional observations..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/refrigeration" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Reading'}
          </button>
        </div>
      </form>
    </div>
  )
}
