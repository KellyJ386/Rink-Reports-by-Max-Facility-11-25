'use client'

import { useState, useEffect } from 'react'
import type { FormField } from '@/types/form-builder'

interface IceDepthPoint {
  id: string
  x: number
  y: number
  label: string
  value?: number
}

interface IceDepthGridConfig {
  preset: '25' | '35' | '47' | 'custom'
  points: IceDepthPoint[]
  targetDepth: number
  unit: 'inches' | 'mm'
}

interface IceDepthGridFieldProps {
  field: FormField
  value?: Record<string, number>
  onChange?: (value: Record<string, number>) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

// Preset configurations for measurement points
const PRESETS: Record<string, IceDepthPoint[]> = {
  '25': generateGridPoints(5, 5),
  '35': generateGridPoints(7, 5),
  '47': generateGridPoints(7, 7),
}

function generateGridPoints(rows: number, cols: number): IceDepthPoint[] {
  const points: IceDepthPoint[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) / cols * 100
      const y = (row + 0.5) / rows * 100
      points.push({
        id: `point_${row}_${col}`,
        x,
        y,
        label: `${String.fromCharCode(65 + row)}${col + 1}`,
      })
    }
  }
  return points
}

export default function IceDepthGridField({
  field,
  value = {},
  onChange,
  disabled = false,
  error,
  preview = false,
}: IceDepthGridFieldProps) {
  const config: IceDepthGridConfig = (field.defaultValue as unknown as IceDepthGridConfig) || {
    preset: '25',
    points: PRESETS['25'],
    targetDepth: 1.0,
    unit: 'inches',
  }

  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const points = config.points || PRESETS[config.preset] || PRESETS['25']

  const handlePointClick = (pointId: string) => {
    if (disabled || preview) return
    setSelectedPoint(pointId)
  }

  const handleValueChange = (pointId: string, newValue: string) => {
    if (disabled || preview) return
    const numValue = newValue === '' ? undefined : parseFloat(newValue)
    const newValues = { ...value }
    if (numValue !== undefined) {
      newValues[pointId] = numValue
    } else {
      delete newValues[pointId]
    }
    onChange?.(newValues)
  }

  const getPointColor = (pointId: string) => {
    const pointValue = value[pointId]
    if (pointValue === undefined) return 'bg-gray-200'

    const diff = pointValue - config.targetDepth
    if (Math.abs(diff) < 0.1) return 'bg-green-500'
    if (diff > 0) return 'bg-blue-500'
    return 'bg-red-500'
  }

  const filledCount = Object.keys(value).length
  const totalCount = points.length

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.validation?.some(v => v.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Rink visualization */}
        <div
          className="relative bg-blue-100 border-4 border-blue-300"
          style={{ paddingBottom: '50%' }}
        >
          {/* Ice surface */}
          <div className="absolute inset-2 bg-white rounded-lg border-2 border-blue-400">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-400" />

            {/* Blue lines */}
            <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-blue-500" />
            <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-blue-500" />

            {/* Center circle */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-blue-500 rounded-full"
              style={{ width: '15%', paddingBottom: '15%' }}
            />

            {/* Measurement points */}
            {points.map((point) => (
              <button
                key={point.id}
                type="button"
                onClick={() => handlePointClick(point.id)}
                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full text-xs font-bold text-white transition-all hover:scale-110 ${getPointColor(point.id)} ${
                  selectedPoint === point.id ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                }`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                disabled={disabled || preview}
                title={`${point.label}: ${value[point.id] !== undefined ? value[point.id] + ' ' + config.unit : 'Not measured'}`}
              >
                {value[point.id] !== undefined ? '✓' : point.label.charAt(0)}
              </button>
            ))}
          </div>
        </div>

        {/* Input panel */}
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Progress: {filledCount}/{totalCount} points
            </span>
            <span className="text-xs text-gray-500">
              Target: {config.targetDepth} {config.unit}
            </span>
          </div>

          {selectedPoint ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {points.find(p => p.id === selectedPoint)?.label}:
              </span>
              <input
                type="number"
                step="0.1"
                value={value[selectedPoint] ?? ''}
                onChange={(e) => handleValueChange(selectedPoint, e.target.value)}
                className="input flex-1"
                placeholder={`Enter depth (${config.unit})`}
                disabled={disabled || preview}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="btn btn-secondary text-sm"
              >
                Done
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Click a point on the rink to enter measurement
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="px-3 pb-3 bg-gray-50 flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span>On target</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Above target</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Below target</span>
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
