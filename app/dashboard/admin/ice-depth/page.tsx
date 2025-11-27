'use client'

import { useState, useEffect } from 'react'
import IceDepthPointEditor from '@/components/modules/IceDepthPointEditor'

interface MeasurementPoint {
  id: string
  x: number
  y: number
  label: string
}

interface Rink {
  id: string
  name: string
  dimensions: string | null
  surfaceType: string
  iceDepthConfiguration?: {
    presetType: string | null
    measurementPoints: MeasurementPoint[]
    backgroundImage?: string | null
    targetDepth: number
    optimalTolerance: number
    warningTolerance: number
  } | null
}

interface Configuration {
  presetType: string
  measurementPoints: MeasurementPoint[]
  backgroundImage: string | null
  targetDepth: number
  optimalTolerance: number
  warningTolerance: number
}

const DEFAULT_CONFIG: Configuration = {
  presetType: 'RINK_25',
  measurementPoints: [],
  backgroundImage: null,
  targetDepth: 1.25,
  optimalTolerance: 0.125,
  warningTolerance: 0.25,
}

export default function IceDepthConfigPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [selectedRinkId, setSelectedRinkId] = useState<string | null>(null)
  const [config, setConfig] = useState<Configuration>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch rinks on mount
  useEffect(() => {
    fetchRinks()
  }, [])

  // Load rink configuration when selection changes
  useEffect(() => {
    if (selectedRinkId) {
      const rink = rinks.find(r => r.id === selectedRinkId)
      if (rink?.iceDepthConfiguration) {
        setConfig({
          presetType: rink.iceDepthConfiguration.presetType || 'RINK_25',
          measurementPoints: rink.iceDepthConfiguration.measurementPoints || [],
          backgroundImage: rink.iceDepthConfiguration.backgroundImage || null,
          targetDepth: rink.iceDepthConfiguration.targetDepth || 1.25,
          optimalTolerance: rink.iceDepthConfiguration.optimalTolerance || 0.125,
          warningTolerance: rink.iceDepthConfiguration.warningTolerance || 0.25,
        })
      } else {
        setConfig(DEFAULT_CONFIG)
      }
    }
  }, [selectedRinkId, rinks])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/rinks')
      if (response.ok) {
        const data = await response.json()
        setRinks(data.rinks || [])
        if (data.rinks?.length > 0) {
          setSelectedRinkId(data.rinks[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch rinks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedRinkId) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/rinks/${selectedRinkId}/ice-depth-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' })
        // Update local state
        setRinks(rinks.map(r =>
          r.id === selectedRinkId
            ? { ...r, iceDepthConfiguration: config as any }
            : r
        ))
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const selectedRink = rinks.find(r => r.id === selectedRinkId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Ice Depth Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure measurement points and target depths for each rink
        </p>
      </div>

      {/* Rink Selector */}
      <div className="card">
        <h3 className="font-medium text-gray-900 mb-3">Select Rink</h3>
        {rinks.length === 0 ? (
          <p className="text-gray-500">No rinks found. Please create a rink first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rinks.map((rink) => (
              <button
                key={rink.id}
                onClick={() => setSelectedRinkId(rink.id)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedRinkId === rink.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {rink.name}
                {rink.dimensions && (
                  <span className="text-xs ml-1 opacity-75">({rink.dimensions})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRink && (
        <>
          {/* Target Depth Settings */}
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-4">Target Depth Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Depth (inches)
                </label>
                <input
                  type="number"
                  value={config.targetDepth}
                  onChange={(e) => setConfig({ ...config, targetDepth: parseFloat(e.target.value) || 1.25 })}
                  step="0.125"
                  min="0.5"
                  max="3"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Standard NHL target is 1.25"
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optimal Tolerance (+/-)
                </label>
                <input
                  type="number"
                  value={config.optimalTolerance}
                  onChange={(e) => setConfig({ ...config, optimalTolerance: parseFloat(e.target.value) || 0.125 })}
                  step="0.0625"
                  min="0.0625"
                  max="0.5"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Green range: {(config.targetDepth - config.optimalTolerance).toFixed(3)}" - {(config.targetDepth + config.optimalTolerance).toFixed(3)}"
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warning Tolerance (+/-)
                </label>
                <input
                  type="number"
                  value={config.warningTolerance}
                  onChange={(e) => setConfig({ ...config, warningTolerance: parseFloat(e.target.value) || 0.25 })}
                  step="0.0625"
                  min="0.125"
                  max="1"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Yellow range: {(config.targetDepth - config.warningTolerance).toFixed(3)}" - {(config.targetDepth - config.optimalTolerance).toFixed(3)}"
                </p>
              </div>
            </div>

            {/* Visual Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Color Legend Preview</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Optimal: {(config.targetDepth - config.optimalTolerance).toFixed(3)}" - {(config.targetDepth + config.optimalTolerance).toFixed(3)}"</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span>Too thick: {">"} {(config.targetDepth + config.optimalTolerance).toFixed(3)}"</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>Getting thin: {(config.targetDepth - config.warningTolerance).toFixed(3)}" - {(config.targetDepth - config.optimalTolerance).toFixed(3)}"</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span>Critical: {"<"} {(config.targetDepth - config.warningTolerance).toFixed(3)}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Measurement Points Configuration */}
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-4">Measurement Points</h3>
            <IceDepthPointEditor
              points={config.measurementPoints}
              onChange={(points) => setConfig({ ...config, measurementPoints: points })}
              backgroundImage={config.backgroundImage}
              onBackgroundChange={(image) => setConfig({ ...config, backgroundImage: image })}
              maxPoints={100}
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setConfig(DEFAULT_CONFIG)
                setMessage(null)
              }}
              className="btn btn-secondary"
              disabled={saving}
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
