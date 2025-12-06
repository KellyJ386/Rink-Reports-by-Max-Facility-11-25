'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RinkDiagram from '@/components/ice-depth/RinkDiagram'
import {
  MeasurementPoint,
  IceDepthPreset,
  PRESETS,
  PRESET_25_POINTS,
  PRESET_35_POINTS,
  PRESET_47_POINTS
} from '@/types/ice-depth'

interface RinkConfig {
  id: string
  name: string
  dimensions?: string
  hasConfiguration: boolean
  configuration?: {
    id: string
    presetType: IceDepthPreset | null
    measurementPoints: MeasurementPoint[]
    pointCount: number
  }
}

export default function ConfigurePage() {
  const router = useRouter()

  const [rinks, setRinks] = useState<RinkConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Configuration state
  const [selectedRinkId, setSelectedRinkId] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<IceDepthPreset>('RINK_25')
  const [customPoints, setCustomPoints] = useState<MeasurementPoint[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    fetchRinks()
  }, [])

  useEffect(() => {
    if (selectedRinkId) {
      const rink = rinks.find(r => r.id === selectedRinkId)
      if (rink?.configuration) {
        setSelectedPreset(rink.configuration.presetType || 'CUSTOM')
        if (rink.configuration.presetType === 'CUSTOM') {
          setCustomPoints(rink.configuration.measurementPoints)
        }
      } else {
        setSelectedPreset('RINK_25')
        setCustomPoints([])
      }
    }
  }, [selectedRinkId, rinks])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/ice-depth/config')
      if (response.ok) {
        const data = await response.json()
        setRinks(data)
        if (data.length > 0 && !selectedRinkId) {
          setSelectedRinkId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching rinks:', error)
      setError('Failed to load rinks')
    } finally {
      setLoading(false)
    }
  }

  const selectedRink = rinks.find(r => r.id === selectedRinkId)

  // Get current measurement points based on selection
  const currentPoints = selectedPreset === 'CUSTOM'
    ? customPoints
    : PRESETS[selectedPreset].points

  const handleSave = async () => {
    if (!selectedRinkId) {
      setError('Please select a rink')
      return
    }

    if (currentPoints.length === 0) {
      setError('Please select a preset or add custom measurement points')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/ice-depth/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRinkId,
          presetType: selectedPreset,
          measurementPoints: currentPoints
        })
      })

      if (response.ok) {
        setSuccess('Configuration saved successfully!')
        fetchRinks() // Refresh data
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save configuration')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addCustomPoint = () => {
    const newPoint: MeasurementPoint = {
      id: `CP${customPoints.length + 1}`,
      x: 50,
      y: 50,
      label: `CP${customPoints.length + 1}`,
      zone: 'Custom'
    }
    setCustomPoints([...customPoints, newPoint])
  }

  const removeCustomPoint = (pointId: string) => {
    setCustomPoints(customPoints.filter(p => p.id !== pointId))
  }

  const updateCustomPoint = (pointId: string, updates: Partial<MeasurementPoint>) => {
    setCustomPoints(customPoints.map(p =>
      p.id === pointId ? { ...p, ...updates } : p
    ))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (rinks.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">&#127959;</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rinks Available</h3>
          <p className="text-gray-500">
            No rinks have been set up for this facility. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Configure Measurement Points</h2>
          <p className="text-sm text-gray-500">Set up ice depth measurement points for each rink</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Rink Selection */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Rink to Configure
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rinks.map((rink) => (
              <button
                key={rink.id}
                onClick={() => setSelectedRinkId(rink.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedRinkId === rink.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{rink.name}</div>
                {rink.dimensions && (
                  <div className="text-sm text-gray-500">{rink.dimensions}</div>
                )}
                <div className="mt-2">
                  {rink.hasConfiguration ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Configured ({rink.configuration?.pointCount} points)
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      Not configured
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedRinkId && (
          <>
            {/* Preset Selection */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Measurement Point Configuration
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(Object.keys(PRESETS) as IceDepthPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedPreset === preset
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {preset === 'RINK_25' ? '25 Points' :
                       preset === 'RINK_35' ? '35 Points' :
                       preset === 'RINK_47' ? '47 Points' : 'Custom'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {PRESETS[preset].description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Diagram */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Preview - {currentPoints.length} Measurement Points
              </h3>
              <RinkDiagram
                measurementPoints={currentPoints}
                readOnly
                size="lg"
              />
            </div>

            {/* Custom Points Editor */}
            {selectedPreset === 'CUSTOM' && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Custom Points</h3>
                  <button
                    onClick={addCustomPoint}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    + Add Point
                  </button>
                </div>

                {customPoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No custom points defined.</p>
                    <p className="text-sm mt-1">Click &ldquo;Add Point&rdquo; to create measurement points.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customPoints.map((point) => (
                      <div
                        key={point.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                      >
                        <input
                          type="text"
                          value={point.label}
                          onChange={(e) => updateCustomPoint(point.id, { label: e.target.value })}
                          className="w-16 px-2 py-1 border rounded text-sm"
                          placeholder="Label"
                        />
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>X:</span>
                          <input
                            type="number"
                            value={point.x}
                            onChange={(e) => updateCustomPoint(point.id, { x: parseInt(e.target.value) || 0 })}
                            className="w-14 px-2 py-1 border rounded text-sm"
                            min="0"
                            max="100"
                          />
                          <span>%</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span>Y:</span>
                          <input
                            type="number"
                            value={point.y}
                            onChange={(e) => updateCustomPoint(point.id, { y: parseInt(e.target.value) || 0 })}
                            className="w-14 px-2 py-1 border rounded text-sm"
                            min="0"
                            max="100"
                          />
                          <span>%</span>
                        </div>
                        <input
                          type="text"
                          value={point.zone || ''}
                          onChange={(e) => updateCustomPoint(point.id, { zone: e.target.value })}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder="Zone (optional)"
                        />
                        <button
                          onClick={() => removeCustomPoint(point.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          &#10005;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start from preset option */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Start with a preset:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCustomPoints([...PRESET_25_POINTS])}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Load 25 Points
                    </button>
                    <button
                      onClick={() => setCustomPoints([...PRESET_35_POINTS])}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Load 35 Points
                    </button>
                    <button
                      onClick={() => setCustomPoints([...PRESET_47_POINTS])}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Load 47 Points
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.push('/dashboard/ice-depth')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || currentPoints.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
