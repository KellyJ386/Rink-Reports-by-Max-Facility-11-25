'use client'

import { useState, useEffect } from 'react'
import { UseFormSetValue, FieldValues } from 'react-hook-form'
import type { IceDepthGridFieldSchema } from '@/types/forms'
import { Input } from '@/components/ui/input'

interface IceDepthGridFieldProps {
  field: IceDepthGridFieldSchema
  setValue: UseFormSetValue<FieldValues>
  defaultValue?: Record<string, number>
  disabled?: boolean
}

// Preset configurations for common rink sizes
const PRESETS = {
  '25': {
    rows: 5,
    cols: 5,
    points: 25,
    label: '25-Point Grid (5x5)',
  },
  '35': {
    rows: 7,
    cols: 5,
    points: 35,
    label: '35-Point Grid (7x5)',
  },
  '47': {
    rows: 9,
    cols: 5,
    points: 47,
    label: '47-Point Grid (9x5)',
  },
}

export default function IceDepthGridField({
  field,
  setValue,
  defaultValue = {},
  disabled = false,
}: IceDepthGridFieldProps) {
  const preset = field.preset || '35'
  const config = PRESETS[preset]
  const minDepth = field.minDepth || 0.5
  const maxDepth = field.maxDepth || 2.0
  const unit = field.unit || 'inches'

  const [measurements, setMeasurements] = useState<Record<string, number>>(defaultValue)
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)

  useEffect(() => {
    setValue(field.id, measurements)
  }, [measurements, field.id, setValue])

  const handleMeasurementChange = (pointId: string, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      // Remove the measurement if invalid
      const { [pointId]: _, ...rest } = measurements
      setMeasurements(rest)
    } else {
      setMeasurements({
        ...measurements,
        [pointId]: numValue,
      })
    }
  }

  const getMeasurement = (pointId: string): number | undefined => {
    return measurements[pointId]
  }

  const getPointColor = (pointId: string): string => {
    const value = getMeasurement(pointId)
    if (value === undefined) return 'bg-wolf-100 border-wolf-300'

    // Color code based on depth
    if (value < minDepth) return 'bg-red-100 border-red-400' // Too thin
    if (value > maxDepth) return 'bg-yellow-100 border-yellow-400' // Too thick
    return 'bg-green-100 border-green-400' // Good
  }

  const calculateAverage = (): number | null => {
    const values = Object.values(measurements)
    if (values.length === 0) return null
    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }

  const getOutOfRangeCount = (): number => {
    return Object.values(measurements).filter(
      (val) => val < minDepth || val > maxDepth
    ).length
  }

  const average = calculateAverage()
  const outOfRange = getOutOfRangeCount()
  const completedPoints = Object.keys(measurements).length

  return (
    <div className="space-y-4">
      {/* Instructions and stats */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">
              Grid Size
            </div>
            <div className="text-lg font-bold text-navy-900">
              {config.label}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">
              Completed
            </div>
            <div className="text-lg font-bold text-navy-900">
              {completedPoints} / {config.points}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">
              Average Depth
            </div>
            <div className="text-lg font-bold text-navy-900">
              {average !== null ? `${average.toFixed(2)} ${unit}` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">
              Out of Range
            </div>
            <div
              className={`text-lg font-bold ${
                outOfRange > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {outOfRange}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
          <span>
            Good ({minDepth}-{maxDepth} {unit})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
          <span>Too Thin (&lt;{minDepth} {unit})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
          <span>Too Thick (&gt;{maxDepth} {unit})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-wolf-100 border-2 border-wolf-300 rounded"></div>
          <span>Not Measured</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border-2 border-wolf-300 rounded-lg p-6">
        {/* Visual grid representation */}
        <div className="mb-6">
          <div
            className="grid gap-2 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
              maxWidth: `${config.cols * 80}px`,
            }}
          >
            {Array.from({ length: config.rows }, (_, row) =>
              Array.from({ length: config.cols }, (_, col) => {
                const pointIndex = row * config.cols + col + 1
                if (pointIndex > config.points) return null

                const pointId = `point-${pointIndex}`
                const value = getMeasurement(pointId)
                const isSelected = selectedPoint === pointId

                return (
                  <button
                    key={pointId}
                    type="button"
                    onClick={() => setSelectedPoint(pointId)}
                    disabled={disabled}
                    className={`
                      aspect-square rounded-lg border-2 transition-all
                      ${getPointColor(pointId)}
                      ${isSelected ? 'ring-4 ring-action-green-500 scale-110' : ''}
                      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full p-1">
                      <div className="text-xs font-medium text-navy-700">
                        {pointIndex}
                      </div>
                      {value !== undefined && (
                        <div className="text-xs font-bold text-navy-900">
                          {value.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Input for selected point */}
        {selectedPoint && (
          <div className="border-t-2 border-wolf-200 pt-4">
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-navy-900 mb-2">
                Enter depth for Point {selectedPoint.split('-')[1]}
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={5}
                  value={getMeasurement(selectedPoint) || ''}
                  onChange={(e) => handleMeasurementChange(selectedPoint, e.target.value)}
                  placeholder={`Enter depth in ${unit}`}
                  disabled={disabled}
                  className="flex-1"
                  autoFocus
                />
                <span className="flex items-center text-sm text-wolf-600 px-2">
                  {unit}
                </span>
              </div>
              <p className="text-xs text-wolf-500 mt-1">
                Recommended range: {minDepth} - {maxDepth} {unit}
              </p>
            </div>
          </div>
        )}

        {!selectedPoint && (
          <p className="text-center text-sm text-wolf-500">
            Click on a point above to enter measurement
          </p>
        )}
      </div>

      {/* Help text */}
      {field.helpText && (
        <p className="text-sm text-wolf-500">{field.helpText}</p>
      )}

      {/* Required indicator */}
      {field.required && completedPoints === 0 && (
        <p className="text-sm text-red-500">
          * This field is required. Please measure at least one point.
        </p>
      )}
    </div>
  )
}
