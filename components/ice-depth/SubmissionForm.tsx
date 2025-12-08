'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import RinkDiagram from './RinkDiagram'
import {
  MeasurementPoint,
  IceDepthReading,
  DEFAULT_DEPTH_TARGETS,
  calculateDepthStats,
} from '@/types/ice-depth'

interface SubmissionFormProps {
  rinkId: string
  rinkName: string
  points: MeasurementPoint[]
  onSubmit: (data: SubmissionData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

interface SubmissionData {
  rinkId: string
  readings: IceDepthReading[]
  outsideTemp?: number
  outsideTempUnit: 'F' | 'C'
  notes?: string
}

export default function SubmissionForm({
  rinkId,
  rinkName,
  points,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SubmissionFormProps) {
  const [readings, setReadings] = useState<Map<string, IceDepthReading>>(new Map())
  const [selectedPoint, setSelectedPoint] = useState<MeasurementPoint | null>(null)
  const [currentDepth, setCurrentDepth] = useState('')
  const [outsideTemp, setOutsideTemp] = useState('')
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const depthInputRef = useRef<HTMLInputElement>(null)

  // Focus depth input when a point is selected
  useEffect(() => {
    if (selectedPoint && depthInputRef.current) {
      const existingReading = readings.get(selectedPoint.id)
      if (existingReading) {
        setCurrentDepth(existingReading.depth.toString())
      } else {
        setCurrentDepth('')
      }
      depthInputRef.current.focus()
    }
  }, [selectedPoint, readings])

  const handlePointClick = useCallback((point: MeasurementPoint) => {
    setSelectedPoint(point)
    setError(null)
  }, [])

  const handleDepthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty, or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCurrentDepth(value)
    }
  }, [])

  const saveCurrentReading = useCallback(() => {
    if (!selectedPoint) return

    const depth = parseFloat(currentDepth)
    if (isNaN(depth) || depth < 0 || depth > 3) {
      setError('Please enter a valid depth between 0 and 3 inches')
      return
    }

    const newReading: IceDepthReading = {
      pointId: selectedPoint.id,
      depth,
      unit: 'inches',
    }

    setReadings((prev) => {
      const updated = new Map(prev)
      updated.set(selectedPoint.id, newReading)
      return updated
    })

    // Move to next point
    const currentIndex = points.findIndex((p) => p.id === selectedPoint.id)
    if (currentIndex < points.length - 1) {
      setSelectedPoint(points[currentIndex + 1])
    } else {
      setSelectedPoint(null)
    }
    setCurrentDepth('')
    setError(null)
  }, [selectedPoint, currentDepth, points])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveCurrentReading()
      } else if (e.key === 'Escape') {
        setSelectedPoint(null)
        setCurrentDepth('')
      }
    },
    [saveCurrentReading]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (readings.size === 0) {
        setError('Please enter at least one reading')
        return
      }

      const data: SubmissionData = {
        rinkId,
        readings: Array.from(readings.values()),
        outsideTempUnit: tempUnit,
        notes: notes.trim() || undefined,
      }

      if (outsideTemp) {
        const temp = parseFloat(outsideTemp)
        if (!isNaN(temp)) {
          data.outsideTemp = temp
        }
      }

      try {
        await onSubmit(data)
      } catch (err) {
        setError('Failed to submit. Please try again.')
      }
    },
    [rinkId, readings, outsideTemp, tempUnit, notes, onSubmit]
  )

  const stats = calculateDepthStats(Array.from(readings.values()))
  const completionPercent = Math.round((readings.size / points.length) * 100)

  // Quick entry buttons for common depths
  const quickDepths = [0.75, 0.875, 1.0, 1.125, 1.25]

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Ice Depth Reading</h2>
            <p className="text-sm text-gray-600 mt-1">{rinkName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
            <p className="text-sm font-medium text-blue-600">
              {readings.size} / {points.length} points ({completionPercent}%)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6">
          {/* Temperature and Notes Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outside Temperature (optional)
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={outsideTemp}
                  onChange={(e) => setOutsideTemp(e.target.value)}
                  placeholder="e.g., 32"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={tempUnit}
                  onChange={(e) => setTempUnit(e.target.value as 'F' | 'C')}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="F">°F</option>
                  <option value="C">°C</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations about ice conditions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Stats Preview */}
          {readings.size > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Average</p>
                <p className="text-lg font-bold text-gray-900">{stats.average.toFixed(2)}&quot;</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Minimum</p>
                <p className="text-lg font-bold text-gray-900">{stats.min.toFixed(2)}&quot;</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Maximum</p>
                <p className="text-lg font-bold text-gray-900">{stats.max.toFixed(2)}&quot;</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Points</p>
                <p className="text-lg font-bold text-gray-900">{readings.size}</p>
              </div>
            </div>
          )}

          {/* Selected Point Entry */}
          {selectedPoint && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-lg font-bold text-blue-900">
                    Point {selectedPoint.label}
                  </span>
                  <span className="text-sm text-blue-600 ml-2">
                    ({selectedPoint.zone?.replace('-', ' ')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPoint(null)
                    setCurrentDepth('')
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Cancel
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    ref={depthInputRef}
                    type="text"
                    value={currentDepth}
                    onChange={handleDepthChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter depth (e.g., 1.0)"
                    className="w-full px-4 py-3 text-lg border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                </div>
                <span className="text-gray-500">inches</span>
                <button
                  type="button"
                  onClick={saveCurrentReading}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save
                </button>
              </div>
              {/* Quick Entry Buttons */}
              <div className="flex gap-2 mt-3">
                <span className="text-sm text-gray-600 mr-2">Quick:</span>
                {quickDepths.map((depth) => (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => {
                      setCurrentDepth(depth.toString())
                      depthInputRef.current?.focus()
                    }}
                    className="px-3 py-1 text-sm bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {depth}&quot;
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Press Enter to save and move to next point, Escape to cancel
              </p>
            </div>
          )}

          {!selectedPoint && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-gray-600">
                Click on a measurement point in the diagram below to enter its depth
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Rink Diagram */}
          <RinkDiagram
            points={points}
            readings={readings}
            onPointClick={handlePointClick}
            selectedPointId={selectedPoint?.id}
            showLabels={true}
            showValues={true}
            interactive={true}
            minDepth={DEFAULT_DEPTH_TARGETS.min}
            maxDepth={DEFAULT_DEPTH_TARGETS.max}
          />

          {/* Target Reference */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Target Depth Reference</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Minimum:</span>{' '}
                <span className="font-medium">{DEFAULT_DEPTH_TARGETS.min}&quot;</span>
              </div>
              <div>
                <span className="text-gray-500">Target:</span>{' '}
                <span className="font-medium">{DEFAULT_DEPTH_TARGETS.target}&quot;</span>
              </div>
              <div>
                <span className="text-gray-500">Maximum:</span>{' '}
                <span className="font-medium">{DEFAULT_DEPTH_TARGETS.max}&quot;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {readings.size === 0 && 'No readings entered yet'}
              {readings.size > 0 && readings.size < points.length && (
                <span className="text-amber-600">
                  {points.length - readings.size} points remaining
                </span>
              )}
              {readings.size === points.length && (
                <span className="text-green-600">All points recorded!</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save as draft logic would go here
                  alert('Draft saved! (Demo)')
                }}
                disabled={isSubmitting || readings.size === 0}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting || readings.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Reading'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
