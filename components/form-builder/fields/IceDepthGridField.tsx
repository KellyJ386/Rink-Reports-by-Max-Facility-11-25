'use client'

import { useState } from 'react'
import type { FormField, IceDepthPoint } from '@/types/form-builder'

interface IceDepthGridFieldProps {
  field: FormField
  value: Record<string, number> | undefined
  onChange: (value: Record<string, number>) => void
  error?: string
  disabled?: boolean
}

// Preset grid configurations for common rink sizes
const PRESET_POINTS: Record<string, IceDepthPoint[]> = {
  '25': generateGridPoints(5, 5, 'Small Rink (25 points)'),
  '35': generateGridPoints(7, 5, 'Medium Rink (35 points)'),
  '47': generateGridPoints(7, 7, 'Large Rink (47 points)'),
}

function generateGridPoints(cols: number, rows: number, _label: string): IceDepthPoint[] {
  const points: IceDepthPoint[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = `${String.fromCharCode(65 + col)}${row + 1}`
      points.push({
        id,
        x: (col / (cols - 1)) * 100,
        y: (row / (rows - 1)) * 100,
        label: id,
      })
    }
  }
  return points
}

export default function IceDepthGridField({
  field,
  value = {},
  onChange,
  error,
  disabled,
}: IceDepthGridFieldProps) {
  const config = field.iceDepthConfig
  const preset = config?.preset || '25'
  const points = config?.points?.length ? config.points : PRESET_POINTS[preset] || PRESET_POINTS['25']
  const unit = config?.unit || 'inches'
  const targetDepth = config?.targetDepth
  const warningThreshold = config?.warningThreshold

  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  // Calculate statistics
  const filledValues = Object.values(value).filter((v) => v !== undefined && v !== null)
  const stats = {
    min: filledValues.length ? Math.min(...filledValues) : null,
    max: filledValues.length ? Math.max(...filledValues) : null,
    avg: filledValues.length
      ? filledValues.reduce((a, b) => a + b, 0) / filledValues.length
      : null,
    count: filledValues.length,
    total: points.length,
  }

  const getPointColor = (pointValue: number | undefined): string => {
    if (pointValue === undefined || pointValue === null) return 'bg-gray-200'
    if (targetDepth) {
      if (warningThreshold) {
        const diff = Math.abs(pointValue - targetDepth)
        if (diff <= warningThreshold * 0.5) return 'bg-green-500'
        if (diff <= warningThreshold) return 'bg-yellow-500'
        return 'bg-red-500'
      }
      return pointValue >= targetDepth ? 'bg-green-500' : 'bg-yellow-500'
    }
    return 'bg-blue-500'
  }

  const handlePointChange = (pointId: string, newValue: string) => {
    const numValue = newValue === '' ? undefined : parseFloat(newValue)
    const updated = { ...value }
    if (numValue === undefined) {
      delete updated[pointId]
    } else {
      updated[pointId] = numValue
    }
    onChange(updated)
  }

  return (
    <div className={`${field.width === 'full' ? 'w-full' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Grid visualization */}
        <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 p-4" style={{ minHeight: '300px' }}>
          {/* Rink outline */}
          <div className="absolute inset-4 border-2 border-blue-300 rounded-[50px] bg-white/50">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-400" />
            {/* Goal creases */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-16 border-2 border-blue-400 rounded-r-full" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-16 border-2 border-blue-400 rounded-l-full" />
          </div>

          {/* Measurement points */}
          {points.map((point) => {
            const pointValue = value[point.id]
            return (
              <div
                key={point.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${point.x * 0.9 + 5}%`,
                  top: `${point.y * 0.85 + 7.5}%`,
                }}
                onMouseEnter={() => setHoveredPoint(point.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div
                  className={`w-8 h-8 rounded-full ${getPointColor(pointValue)} text-white text-xs font-bold flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-md`}
                  title={`${point.label}: ${pointValue !== undefined ? `${pointValue} ${unit}` : 'Not measured'}`}
                >
                  {point.label}
                </div>

                {/* Tooltip on hover */}
                {hoveredPoint === point.id && (
                  <div className="absolute z-10 -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {pointValue !== undefined ? `${pointValue} ${unit}` : 'Click to enter'}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Statistics bar */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-gray-600">
              Progress: <strong>{stats.count}/{stats.total}</strong>
            </span>
            {stats.min !== null && (
              <span className="text-gray-600">
                Min: <strong>{stats.min.toFixed(2)}</strong>
              </span>
            )}
            {stats.avg !== null && (
              <span className="text-gray-600">
                Avg: <strong>{stats.avg.toFixed(2)}</strong>
              </span>
            )}
            {stats.max !== null && (
              <span className="text-gray-600">
                Max: <strong>{stats.max.toFixed(2)}</strong>
              </span>
            )}
          </div>
          {targetDepth && (
            <span className="text-gray-500">
              Target: {targetDepth} {unit}
            </span>
          )}
        </div>

        {/* Data entry grid */}
        <div className="p-4 border-t border-gray-200 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-5 gap-2">
            {points.map((point) => (
              <div key={point.id} className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-500 w-6">{point.label}</span>
                <input
                  type="number"
                  value={value[point.id] ?? ''}
                  onChange={(e) => handlePointChange(point.id, e.target.value)}
                  disabled={disabled}
                  step="0.01"
                  className="input text-sm py-1 px-2 w-20"
                  placeholder="--"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
