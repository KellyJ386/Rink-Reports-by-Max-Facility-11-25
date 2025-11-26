'use client'

import { useState } from 'react'
import { FormField, IceDepthGridConfig, IceDepthPoint } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface IceDepthGridFieldProps {
  field: FormField
  value?: Record<string, number>
  onChange?: (value: Record<string, number>) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function IceDepthGridField({
  field,
  value = {},
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: IceDepthGridFieldProps) {
  const config = field.iceDepthGridConfig
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)

  if (!config) {
    return (
      <FieldWrapper
        field={field}
        error={error}
        isBuilder={isBuilder}
        isSelected={isSelected}
        onClick={onClick}
      >
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Ice depth grid not configured</p>
        </div>
      </FieldWrapper>
    )
  }

  const handlePointChange = (pointId: string, depth: number) => {
    onChange?.({ ...value, [pointId]: depth })
  }

  const getPointColor = (pointId: string) => {
    const depth = value[pointId]
    if (depth === undefined) return 'bg-gray-200'

    if (config.minValue && depth < config.minValue) return 'bg-red-400'
    if (config.maxValue && depth > config.maxValue) return 'bg-red-400'
    if (config.targetValue) {
      const tolerance = 0.1
      if (Math.abs(depth - config.targetValue) <= tolerance) return 'bg-green-400'
    }
    return 'bg-blue-400'
  }

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Rink diagram */}
        <div
          className={`relative w-full aspect-[2/1] bg-white border-2 rounded-lg overflow-hidden ${
            config.showRinkOutline ? 'border-blue-300' : 'border-gray-200'
          }`}
        >
          {/* Rink outline */}
          {config.showRinkOutline && (
            <>
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-400 opacity-50" />
              {/* Goal lines */}
              <div className="absolute left-[10%] top-0 bottom-0 w-0.5 bg-red-400 opacity-50" />
              <div className="absolute right-[10%] top-0 bottom-0 w-0.5 bg-red-400 opacity-50" />
              {/* Blue lines */}
              <div className="absolute left-[30%] top-0 bottom-0 w-0.5 bg-blue-400 opacity-50" />
              <div className="absolute right-[30%] top-0 bottom-0 w-0.5 bg-blue-400 opacity-50" />
              {/* Center circle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-blue-400 rounded-full opacity-50" />
            </>
          )}

          {/* Measurement points */}
          {config.points.map((point) => (
            <button
              key={point.id}
              type="button"
              disabled={disabled || isBuilder}
              onClick={() => !isBuilder && setSelectedPoint(point.id)}
              className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full text-xs font-bold text-white flex items-center justify-center transition-transform hover:scale-110 ${getPointColor(
                point.id
              )} ${
                selectedPoint === point.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              } ${disabled || isBuilder ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
              title={`${point.label}: ${value[point.id] ?? '-'} ${config.unit}`}
            >
              {point.label.length <= 2 ? point.label : ''}
            </button>
          ))}
        </div>

        {/* Selected point input */}
        {selectedPoint && !isBuilder && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Point {config.points.find((p) => p.id === selectedPoint)?.label}:
            </span>
            <input
              type="number"
              step="0.01"
              value={value[selectedPoint] ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val)) {
                  handlePointChange(selectedPoint, val)
                }
              }}
              className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <span className="text-sm text-gray-500">{config.unit}</span>
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Legend */}
        {!isBuilder && (
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-200" />
              <span>Not measured</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span>On target</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-400" />
              <span>Within range</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span>Out of range</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {!isBuilder && Object.keys(value).length > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Points</div>
              <div className="font-semibold">
                {Object.keys(value).length}/{config.points.length}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Min</div>
              <div className="font-semibold">
                {Math.min(...Object.values(value)).toFixed(2)}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Max</div>
              <div className="font-semibold">
                {Math.max(...Object.values(value)).toFixed(2)}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Avg</div>
              <div className="font-semibold">
                {(
                  Object.values(value).reduce((a, b) => a + b, 0) /
                  Object.values(value).length
                ).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Builder placeholder */}
        {isBuilder && (
          <p className="text-xs text-gray-500 text-center">
            {config.points.length} measurement points configured
          </p>
        )}
      </div>
    </FieldWrapper>
  )
}
