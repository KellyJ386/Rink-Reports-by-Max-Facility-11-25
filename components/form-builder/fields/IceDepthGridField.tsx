'use client'

import { useState } from 'react'
import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldWrapper, FieldEditWrapper } from './FieldWrapper'

interface IceDepthValue {
  [pointId: string]: number | null
}

interface MeasurementPoint {
  id: string
  x: number
  y: number
  label: string
}

// Default 25-point grid
const DEFAULT_POINTS: MeasurementPoint[] = [
  // Row 1 (top)
  { id: 'p1', x: 10, y: 10, label: '1' },
  { id: 'p2', x: 30, y: 10, label: '2' },
  { id: 'p3', x: 50, y: 10, label: '3' },
  { id: 'p4', x: 70, y: 10, label: '4' },
  { id: 'p5', x: 90, y: 10, label: '5' },
  // Row 2
  { id: 'p6', x: 10, y: 30, label: '6' },
  { id: 'p7', x: 30, y: 30, label: '7' },
  { id: 'p8', x: 50, y: 30, label: '8' },
  { id: 'p9', x: 70, y: 30, label: '9' },
  { id: 'p10', x: 90, y: 30, label: '10' },
  // Row 3 (middle)
  { id: 'p11', x: 10, y: 50, label: '11' },
  { id: 'p12', x: 30, y: 50, label: '12' },
  { id: 'p13', x: 50, y: 50, label: '13' },
  { id: 'p14', x: 70, y: 50, label: '14' },
  { id: 'p15', x: 90, y: 50, label: '15' },
  // Row 4
  { id: 'p16', x: 10, y: 70, label: '16' },
  { id: 'p17', x: 30, y: 70, label: '17' },
  { id: 'p18', x: 50, y: 70, label: '18' },
  { id: 'p19', x: 70, y: 70, label: '19' },
  { id: 'p20', x: 90, y: 70, label: '20' },
  // Row 5 (bottom)
  { id: 'p21', x: 10, y: 90, label: '21' },
  { id: 'p22', x: 30, y: 90, label: '22' },
  { id: 'p23', x: 50, y: 90, label: '23' },
  { id: 'p24', x: 70, y: 90, label: '24' },
  { id: 'p25', x: 90, y: 90, label: '25' },
]

// Calculate statistics
function calculateStats(values: IceDepthValue): { avg: number; min: number; max: number; count: number } {
  const nums = Object.values(values).filter((v): v is number => v !== null && v !== undefined)
  if (nums.length === 0) {
    return { avg: 0, min: 0, max: 0, count: 0 }
  }
  return {
    avg: nums.reduce((a, b) => a + b, 0) / nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
    count: nums.length,
  }
}

// Ice Depth Grid - Render mode
export function IceDepthGridFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const values = (value as IceDepthValue) || {}
  const stats = calculateStats(values)

  const handleValueChange = (pointId: string, newValue: string) => {
    const numValue = newValue === '' ? null : parseFloat(newValue)
    onChange({
      ...values,
      [pointId]: numValue,
    })
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Rink diagram */}
        <div className="relative bg-gradient-to-b from-blue-100 to-blue-200 p-4" style={{ aspectRatio: '2/1' }}>
          {/* Rink outline */}
          <div className="absolute inset-4 border-2 border-blue-400 rounded-full opacity-30" />

          {/* Center line */}
          <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-red-400 opacity-30" />

          {/* Measurement points */}
          {DEFAULT_POINTS.map((point) => {
            const pointValue = values[point.id]
            const hasValue = pointValue !== null && pointValue !== undefined

            return (
              <button
                key={point.id}
                type="button"
                onClick={() => setSelectedPoint(point.id)}
                disabled={disabled || field.disabled}
                className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  selectedPoint === point.id
                    ? 'bg-blue-600 text-white ring-4 ring-blue-300 scale-110'
                    : hasValue
                    ? 'bg-green-500 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-400'
                } ${disabled || field.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                title={`Point ${point.label}: ${hasValue ? pointValue : 'No value'}`}
              >
                {hasValue ? pointValue?.toFixed(1) : point.label}
              </button>
            )
          })}
        </div>

        {/* Input panel */}
        {selectedPoint && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">
                Point {DEFAULT_POINTS.find(p => p.id === selectedPoint)?.label}:
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="3"
                value={values[selectedPoint] ?? ''}
                onChange={(e) => handleValueChange(selectedPoint, e.target.value)}
                disabled={disabled || field.disabled}
                className="input w-24"
                placeholder="0.0"
                autoFocus
              />
              <span className="text-sm text-gray-500">inches</span>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="border-t bg-gray-50 px-4 py-3 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">Readings</div>
            <div className="text-lg font-semibold text-gray-900">{stats.count}/25</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Average</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count > 0 ? stats.avg.toFixed(2) : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Min</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count > 0 ? stats.min.toFixed(2) : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Max</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count > 0 ? stats.max.toFixed(2) : '-'}
            </div>
          </div>
        </div>
      </div>
    </FieldWrapper>
  )
}

// Ice Depth Grid - Edit mode
export function IceDepthGridFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <div className="border rounded-lg overflow-hidden">
          {/* Simplified preview */}
          <div className="relative bg-gradient-to-b from-blue-100 to-blue-200 p-4" style={{ aspectRatio: '3/1' }}>
            {/* Sample points */}
            <div className="absolute inset-4 flex items-center justify-center">
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs text-gray-500"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-3 py-2 text-center">
            <span className="text-xs text-gray-500">25-point ice depth measurement grid</span>
          </div>
        </div>
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
