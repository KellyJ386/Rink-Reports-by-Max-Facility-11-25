'use client'

import { useState, useEffect } from 'react'
import { FormField } from '@/types'

interface IceDepthGridFieldProps {
  field: FormField
  value: IceDepthGridValue
  onChange: (value: IceDepthGridValue) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export interface IceDepthGridValue {
  measurements: Record<string, number | null> // pointId -> depth in inches
  timestamp?: string
  operator?: string
  notes?: string
}

// Default NHL/Standard rink measurement points
const DEFAULT_MEASUREMENT_POINTS = [
  // Goal crease areas
  { id: 'goal_1_center', label: 'Goal 1 Center', x: 10, y: 50 },
  { id: 'goal_1_left', label: 'Goal 1 Left', x: 10, y: 30 },
  { id: 'goal_1_right', label: 'Goal 1 Right', x: 10, y: 70 },

  // Blue line - Goal 1 end
  { id: 'blue_1_left', label: 'Blue Line 1 Left', x: 25, y: 20 },
  { id: 'blue_1_center', label: 'Blue Line 1 Center', x: 25, y: 50 },
  { id: 'blue_1_right', label: 'Blue Line 1 Right', x: 25, y: 80 },

  // Center ice
  { id: 'center_left', label: 'Center Left', x: 50, y: 20 },
  { id: 'center', label: 'Center Ice', x: 50, y: 50 },
  { id: 'center_right', label: 'Center Right', x: 50, y: 80 },

  // Blue line - Goal 2 end
  { id: 'blue_2_left', label: 'Blue Line 2 Left', x: 75, y: 20 },
  { id: 'blue_2_center', label: 'Blue Line 2 Center', x: 75, y: 50 },
  { id: 'blue_2_right', label: 'Blue Line 2 Right', x: 75, y: 80 },

  // Goal crease areas
  { id: 'goal_2_center', label: 'Goal 2 Center', x: 90, y: 50 },
  { id: 'goal_2_left', label: 'Goal 2 Left', x: 90, y: 30 },
  { id: 'goal_2_right', label: 'Goal 2 Right', x: 90, y: 70 },
]

export function IceDepthGridField({
  field,
  value,
  onChange,
  error,
  disabled,
  preview,
}: IceDepthGridFieldProps) {
  const [localValue, setLocalValue] = useState<IceDepthGridValue>(
    value || { measurements: {} }
  )

  const measurementPoints = DEFAULT_MEASUREMENT_POINTS

  // Target ice depth thresholds (in inches)
  const minDepth = field.min ?? 0.75
  const maxDepth = field.max ?? 1.25
  const targetDepth = (minDepth + maxDepth) / 2

  const handleMeasurementChange = (pointId: string, depth: string) => {
    const numValue = depth === '' ? null : parseFloat(depth)
    const newMeasurements = {
      ...localValue.measurements,
      [pointId]: numValue,
    }
    const newValue = { ...localValue, measurements: newMeasurements }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const getDepthColor = (depth: number | null): string => {
    if (depth === null) return 'bg-gray-200'
    if (depth < minDepth) return 'bg-red-400' // Too thin
    if (depth > maxDepth) return 'bg-blue-400' // Too thick
    return 'bg-green-400' // Just right
  }

  const getDepthStatus = (depth: number | null): string => {
    if (depth === null) return 'Not measured'
    if (depth < minDepth) return 'Too thin'
    if (depth > maxDepth) return 'Too thick'
    return 'OK'
  }

  // Calculate statistics
  const allMeasurements = Object.values(localValue.measurements).filter(
    (v): v is number => v !== null
  )
  const avgDepth = allMeasurements.length > 0
    ? allMeasurements.reduce((a, b) => a + b, 0) / allMeasurements.length
    : null
  const minMeasured = allMeasurements.length > 0 ? Math.min(...allMeasurements) : null
  const maxMeasured = allMeasurements.length > 0 ? Math.max(...allMeasurements) : null

  return (
    <div className="field-wrapper w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Rink visualization */}
      <div className="relative bg-white border border-gray-300 rounded-lg overflow-hidden">
        {/* Rink surface */}
        <div
          className="relative w-full bg-gradient-to-b from-blue-50 to-blue-100"
          style={{ aspectRatio: '2/1' }}
        >
          {/* Rink lines */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Goal lines */}
            <line x1="5" y1="0" x2="5" y2="100" stroke="#cc0000" strokeWidth="0.5" />
            <line x1="95" y1="0" x2="95" y2="100" stroke="#cc0000" strokeWidth="0.5" />
            {/* Blue lines */}
            <line x1="25" y1="0" x2="25" y2="100" stroke="#0066cc" strokeWidth="0.8" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#0066cc" strokeWidth="0.8" />
            {/* Center line */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#cc0000" strokeWidth="0.5" />
            {/* Center circle */}
            <circle cx="50" cy="50" r="15" fill="none" stroke="#0066cc" strokeWidth="0.5" />
          </svg>

          {/* Measurement points */}
          {measurementPoints.map((point) => {
            const depth = localValue.measurements[point.id]
            return (
              <div
                key={point.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white cursor-pointer transition-transform hover:scale-125 ${getDepthColor(depth)}`}
                  title={`${point.label}: ${depth !== null ? `${depth}"` : 'Not measured'}`}
                >
                  {depth !== null ? depth.toFixed(1) : '?'}
                </div>

                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {point.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Measurement inputs */}
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
        {measurementPoints.map((point) => (
          <div key={point.id}>
            <label className="block text-xs text-gray-600 mb-1 truncate" title={point.label}>
              {point.label.split(' ').slice(-2).join(' ')}
            </label>
            <input
              type="number"
              value={localValue.measurements[point.id] ?? ''}
              onChange={(e) => handleMeasurementChange(point.id, e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max="3"
              disabled={disabled || preview}
              className="input w-full text-sm py-1"
            />
          </div>
        ))}
      </div>

      {/* Statistics */}
      {allMeasurements.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Average:</span>
              <span className="ml-2 font-medium">{avgDepth?.toFixed(2)}&quot;</span>
            </div>
            <div>
              <span className="text-gray-500">Min:</span>
              <span className="ml-2 font-medium">{minMeasured?.toFixed(2)}&quot;</span>
            </div>
            <div>
              <span className="text-gray-500">Max:</span>
              <span className="ml-2 font-medium">{maxMeasured?.toFixed(2)}&quot;</span>
            </div>
            <div>
              <span className="text-gray-500">Points:</span>
              <span className="ml-2 font-medium">{allMeasurements.length}/{measurementPoints.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span>OK ({minDepth}&quot; - {maxDepth}&quot;)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span>Too thin (&lt;{minDepth}&quot;)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span>Too thick (&gt;{maxDepth}&quot;)</span>
        </div>
      </div>

      {field.helpText && (
        <p className="mt-2 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
