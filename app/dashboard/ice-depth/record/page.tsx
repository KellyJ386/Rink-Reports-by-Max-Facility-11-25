'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import RinkDiagram from '@/components/ice-depth/RinkDiagram'
import {
  MeasurementPoint,
  PointMeasurement,
  DEFAULT_TARGET_DEPTH,
  calculateReadingStats,
  formatDepth,
  getDepthStatus,
  DEPTH_STATUS_COLORS
} from '@/types/ice-depth'

interface RinkConfig {
  id: string
  name: string
  hasConfiguration: boolean
  configuration?: {
    measurementPoints: MeasurementPoint[]
    presetType: string | null
  }
}

function RecordReadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedRinkId = searchParams.get('rinkId')

  const [rinks, setRinks] = useState<RinkConfig[]>([])
  const [selectedRinkId, setSelectedRinkId] = useState<string>(preSelectedRinkId || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [targetDepth, setTargetDepth] = useState<number>(DEFAULT_TARGET_DEPTH)
  const [measurements, setMeasurements] = useState<PointMeasurement[]>([])
  const [outsideTemp, setOutsideTemp] = useState<string>('')
  const [iceTemp, setIceTemp] = useState<string>('')
  const [notes, setNotes] = useState('')

  // UI state
  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null)
  const [currentDepthInput, setCurrentDepthInput] = useState('')

  useEffect(() => {
    fetchRinks()
  }, [])

  useEffect(() => {
    if (preSelectedRinkId && rinks.length > 0) {
      setSelectedRinkId(preSelectedRinkId)
    }
  }, [preSelectedRinkId, rinks])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/ice-depth/config')
      if (response.ok) {
        const data = await response.json()
        setRinks(data.filter((r: RinkConfig) => r.hasConfiguration))
      }
    } catch (error) {
      console.error('Error fetching rinks:', error)
      setError('Failed to load rinks')
    } finally {
      setLoading(false)
    }
  }

  const selectedRink = rinks.find(r => r.id === selectedRinkId)
  const measurementPoints = selectedRink?.configuration?.measurementPoints || []

  // Calculate completion percentage
  const completedPoints = measurements.filter(m =>
    measurementPoints.some(p => p.id === m.pointId)
  ).length
  const completionPercent = measurementPoints.length > 0
    ? Math.round((completedPoints / measurementPoints.length) * 100)
    : 0

  // Calculate current stats
  const stats = calculateReadingStats(measurements, targetDepth)

  const handlePointClick = (point: MeasurementPoint) => {
    setSelectedPoint(point)
    const existing = measurements.find(m => m.pointId === point.id)
    setCurrentDepthInput(existing ? existing.depth.toString() : '')
  }

  const handleDepthSubmit = () => {
    if (!selectedPoint || !currentDepthInput) return

    const depth = parseFloat(currentDepthInput)
    if (isNaN(depth) || depth < 0 || depth > 5) {
      setError('Depth must be between 0 and 5 inches')
      return
    }

    setMeasurements(prev => {
      const existing = prev.findIndex(m => m.pointId === selectedPoint.id)
      const newMeasurement: PointMeasurement = {
        pointId: selectedPoint.id,
        depth
      }

      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newMeasurement
        return updated
      }
      return [...prev, newMeasurement]
    })

    // Move to next point
    const currentIndex = measurementPoints.findIndex(p => p.id === selectedPoint.id)
    const nextPoint = measurementPoints[currentIndex + 1]
    if (nextPoint) {
      setSelectedPoint(nextPoint)
      const existing = measurements.find(m => m.pointId === nextPoint.id)
      setCurrentDepthInput(existing ? existing.depth.toString() : '')
    } else {
      setSelectedPoint(null)
      setCurrentDepthInput('')
    }

    setError('')
  }

  const handleQuickDepth = (depth: number) => {
    setCurrentDepthInput(depth.toString())
  }

  const handleSave = async () => {
    if (!selectedRinkId) {
      setError('Please select a rink')
      return
    }

    if (measurements.length === 0) {
      setError('Please record at least one measurement')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/ice-depth/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRinkId,
          targetDepth,
          measurements,
          outsideTemp: outsideTemp ? parseFloat(outsideTemp) : null,
          iceTemp: iceTemp ? parseFloat(iceTemp) : null,
          notes: notes || null
        })
      })

      if (response.ok) {
        router.push('/dashboard/ice-depth')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save reading')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
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
          <div className="text-4xl mb-4">&#9881;</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Configured Rinks</h3>
          <p className="text-gray-500 mb-4">
            You need to configure measurement points for at least one rink before recording readings.
          </p>
          <button
            onClick={() => router.push('/dashboard/ice-depth/configure')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Configure Rinks
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Record Ice Depth Reading</h2>
          <p className="text-sm text-gray-500">Click on measurement points to enter depth values</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Rink Selection */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Rink *
              </label>
              <select
                value={selectedRinkId}
                onChange={(e) => {
                  setSelectedRinkId(e.target.value)
                  setMeasurements([])
                  setSelectedPoint(null)
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a rink...</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>{rink.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Depth (inches)
              </label>
              <input
                type="number"
                value={targetDepth}
                onChange={(e) => setTargetDepth(parseFloat(e.target.value) || DEFAULT_TARGET_DEPTH)}
                step="0.125"
                min="0.5"
                max="2.0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progress
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {completedPoints}/{measurementPoints.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rink Diagram */}
        {selectedRinkId && measurementPoints.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <RinkDiagram
              measurementPoints={measurementPoints}
              measurements={measurements}
              targetDepth={targetDepth}
              onPointClick={handlePointClick}
              selectedPointId={selectedPoint?.id}
              size="lg"
            />
          </div>
        )}

        {/* Measurement Input Panel */}
        {selectedPoint && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-900">
                  Point {selectedPoint.label}
                </h3>
                {selectedPoint.zone && (
                  <p className="text-sm text-gray-500">{selectedPoint.zone}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                &#10005;
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depth (inches)
                </label>
                <input
                  type="number"
                  value={currentDepthInput}
                  onChange={(e) => setCurrentDepthInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDepthSubmit()}
                  step="0.0625"
                  min="0"
                  max="5"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-mono"
                  autoFocus
                />
              </div>
              <button
                onClick={handleDepthSubmit}
                disabled={!currentDepthInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Next
              </button>
            </div>

            {/* Quick depth buttons */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Quick entry:</p>
              <div className="flex gap-2 flex-wrap">
                {[1.0, 1.125, 1.25, 1.375, 1.5].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleQuickDepth(d)}
                    className={`px-3 py-1 rounded text-sm ${
                      parseFloat(currentDepthInput) === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formatDepth(d)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {measurements.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Reading Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Average</div>
                <div className="text-lg font-bold text-gray-900">{formatDepth(stats.averageDepth)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Minimum</div>
                <div className="text-lg font-bold text-gray-900">{formatDepth(stats.minDepth)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Maximum</div>
                <div className="text-lg font-bold text-gray-900">{formatDepth(stats.maxDepth)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Below Target</div>
                <div className="text-lg font-bold" style={{ color: DEPTH_STATUS_COLORS.low }}>
                  {stats.pointsBelowTarget}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Above Target</div>
                <div className="text-lg font-bold" style={{ color: DEPTH_STATUS_COLORS.high }}>
                  {stats.pointsAboveTarget}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Environmental Conditions (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outside Temperature
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={outsideTemp}
                  onChange={(e) => setOutsideTemp(e.target.value)}
                  placeholder="--"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-600">&#176;F</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ice Temperature
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={iceTemp}
                  onChange={(e) => setIceTemp(e.target.value)}
                  placeholder="--"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="px-3 py-2 bg-gray-100 border rounded-lg text-gray-600">&#176;F</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or notes about this reading..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

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
            disabled={saving || measurements.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Reading'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecordReadingPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <RecordReadingContent />
    </Suspense>
  )
}
