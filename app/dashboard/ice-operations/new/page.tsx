'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

const OPERATION_TYPES = [
  { value: 'ice_make', label: 'Ice Make', icon: '🧊', description: 'Building new ice layer' },
  { value: 'circle_check', label: 'Circle Check', icon: '🔄', description: 'Pre-shift equipment inspection' },
  { value: 'edging', label: 'Edging', icon: '📐', description: 'Edge maintenance around boards' },
  { value: 'blade_change', label: 'Blade Change', icon: '🔪', description: 'Resurfacer blade replacement' },
  { value: 'resurfacing', label: 'Resurfacing', icon: '🚜', description: 'Standard ice resurfacing' },
  { value: 'other', label: 'Other', icon: '📝', description: 'Other maintenance activity' },
]

export default function NewIceOperationPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    rinkId: '',
    operationType: '',
    outsideTemp: '',
    resurfacerHours: '',
    waterTemp: '',
    iceTemp: '',
    notes: '',
    // Circle check items
    bladeCondition: '',
    clothCondition: '',
    waterLevel: false,
    lightsWorking: false,
    emergencyStop: false,
  })

  useEffect(() => {
    fetchRinks()
  }, [])

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

    if (!formData.rinkId || !formData.operationType) {
      setError('Please select a rink and operation type')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: 'ice-ops-default',
          rinkId: formData.rinkId,
          outsideTemp: formData.outsideTemp ? parseFloat(formData.outsideTemp) : null,
          data: {
            operationType: formData.operationType,
            resurfacerHours: formData.resurfacerHours ? parseFloat(formData.resurfacerHours) : null,
            waterTemp: formData.waterTemp ? parseFloat(formData.waterTemp) : null,
            iceTemp: formData.iceTemp ? parseFloat(formData.iceTemp) : null,
            notes: formData.notes,
            circleCheck: formData.operationType === 'circle_check' ? {
              bladeCondition: formData.bladeCondition,
              clothCondition: formData.clothCondition,
              waterLevel: formData.waterLevel,
              lightsWorking: formData.lightsWorking,
              emergencyStop: formData.emergencyStop,
            } : null,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/dashboard/ice-operations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedOp = OPERATION_TYPES.find((t) => t.value === formData.operationType)

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/ice-operations" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Ice Operation</h1>
          <p className="text-gray-600 text-sm mt-1">Record maintenance and operations activity</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Operation Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outside Temp</label>
              <div className="flex">
                <input
                  type="number"
                  value={formData.outsideTemp}
                  onChange={(e) => setFormData({ ...formData, outsideTemp: e.target.value })}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">°F</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {OPERATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, operationType: type.value })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    formData.operationType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Operation-specific fields */}
        {formData.operationType && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedOp?.label} Details</h2>

            {/* Resurfacing / Ice Make fields */}
            {['ice_make', 'resurfacing'].includes(formData.operationType) && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resurfacer Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.resurfacerHours}
                    onChange={(e) => setFormData({ ...formData, resurfacerHours: e.target.value })}
                    className="input"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Water Temp</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={formData.waterTemp}
                      onChange={(e) => setFormData({ ...formData, waterTemp: e.target.value })}
                      className="input rounded-r-none"
                      placeholder="--"
                    />
                    <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ice Temp</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={formData.iceTemp}
                      onChange={(e) => setFormData({ ...formData, iceTemp: e.target.value })}
                      className="input rounded-r-none"
                      placeholder="--"
                    />
                    <span className="px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500 text-sm">°F</span>
                  </div>
                </div>
              </div>
            )}

            {/* Circle Check fields */}
            {formData.operationType === 'circle_check' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blade Condition</label>
                    <select
                      value={formData.bladeCondition}
                      onChange={(e) => setFormData({ ...formData, bladeCondition: e.target.value })}
                      className="input"
                    >
                      <option value="">Select...</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs_attention">Needs Attention</option>
                      <option value="replace">Replace Soon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cloth Condition</label>
                    <select
                      value={formData.clothCondition}
                      onChange={(e) => setFormData({ ...formData, clothCondition: e.target.value })}
                      className="input"
                    >
                      <option value="">Select...</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs_attention">Needs Attention</option>
                      <option value="replace">Replace Soon</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.waterLevel}
                      onChange={(e) => setFormData({ ...formData, waterLevel: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Water level OK</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.lightsWorking}
                      onChange={(e) => setFormData({ ...formData, lightsWorking: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">All lights working</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.emergencyStop}
                      onChange={(e) => setFormData({ ...formData, emergencyStop: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Emergency stop tested</span>
                  </label>
                </div>
              </div>
            )}

            {/* Blade Change fields */}
            {formData.operationType === 'blade_change' && (
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resurfacer Hours at Change</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.resurfacerHours}
                    onChange={(e) => setFormData({ ...formData, resurfacerHours: e.target.value })}
                    className="input"
                    placeholder="Current hour meter reading"
                  />
                </div>
              </div>
            )}
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
            placeholder="Any additional notes or observations..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/ice-operations" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Log Operation'}
          </button>
        </div>
      </form>
    </div>
  )
}
