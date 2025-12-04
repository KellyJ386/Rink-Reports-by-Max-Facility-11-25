'use client'

import { useState, useCallback } from 'react'
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

export type GridType = '25' | '35' | '47' | 'custom'

// 25-point grid (5x5)
const GRID_25_POINTS: MeasurementPoint[] = [
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

// 35-point grid (7x5)
const GRID_35_POINTS: MeasurementPoint[] = [
  // Row 1 (top)
  { id: 'p1', x: 7, y: 10, label: '1' },
  { id: 'p2', x: 21, y: 10, label: '2' },
  { id: 'p3', x: 36, y: 10, label: '3' },
  { id: 'p4', x: 50, y: 10, label: '4' },
  { id: 'p5', x: 64, y: 10, label: '5' },
  { id: 'p6', x: 79, y: 10, label: '6' },
  { id: 'p7', x: 93, y: 10, label: '7' },
  // Row 2
  { id: 'p8', x: 7, y: 30, label: '8' },
  { id: 'p9', x: 21, y: 30, label: '9' },
  { id: 'p10', x: 36, y: 30, label: '10' },
  { id: 'p11', x: 50, y: 30, label: '11' },
  { id: 'p12', x: 64, y: 30, label: '12' },
  { id: 'p13', x: 79, y: 30, label: '13' },
  { id: 'p14', x: 93, y: 30, label: '14' },
  // Row 3 (middle)
  { id: 'p15', x: 7, y: 50, label: '15' },
  { id: 'p16', x: 21, y: 50, label: '16' },
  { id: 'p17', x: 36, y: 50, label: '17' },
  { id: 'p18', x: 50, y: 50, label: '18' },
  { id: 'p19', x: 64, y: 50, label: '19' },
  { id: 'p20', x: 79, y: 50, label: '20' },
  { id: 'p21', x: 93, y: 50, label: '21' },
  // Row 4
  { id: 'p22', x: 7, y: 70, label: '22' },
  { id: 'p23', x: 21, y: 70, label: '23' },
  { id: 'p24', x: 36, y: 70, label: '24' },
  { id: 'p25', x: 50, y: 70, label: '25' },
  { id: 'p26', x: 64, y: 70, label: '26' },
  { id: 'p27', x: 79, y: 70, label: '27' },
  { id: 'p28', x: 93, y: 70, label: '28' },
  // Row 5 (bottom)
  { id: 'p29', x: 7, y: 90, label: '29' },
  { id: 'p30', x: 21, y: 90, label: '30' },
  { id: 'p31', x: 36, y: 90, label: '31' },
  { id: 'p32', x: 50, y: 90, label: '32' },
  { id: 'p33', x: 64, y: 90, label: '33' },
  { id: 'p34', x: 79, y: 90, label: '34' },
  { id: 'p35', x: 93, y: 90, label: '35' },
]

// 47-point grid (comprehensive NHL-style)
const GRID_47_POINTS: MeasurementPoint[] = [
  // Row 1 (goal crease area - top)
  { id: 'p1', x: 5, y: 8, label: '1' },
  { id: 'p2', x: 15, y: 8, label: '2' },
  { id: 'p3', x: 25, y: 8, label: '3' },
  { id: 'p4', x: 37, y: 8, label: '4' },
  { id: 'p5', x: 50, y: 8, label: '5' },
  { id: 'p6', x: 63, y: 8, label: '6' },
  { id: 'p7', x: 75, y: 8, label: '7' },
  { id: 'p8', x: 85, y: 8, label: '8' },
  { id: 'p9', x: 95, y: 8, label: '9' },
  // Row 2
  { id: 'p10', x: 5, y: 24, label: '10' },
  { id: 'p11', x: 20, y: 24, label: '11' },
  { id: 'p12', x: 35, y: 24, label: '12' },
  { id: 'p13', x: 50, y: 24, label: '13' },
  { id: 'p14', x: 65, y: 24, label: '14' },
  { id: 'p15', x: 80, y: 24, label: '15' },
  { id: 'p16', x: 95, y: 24, label: '16' },
  // Row 3
  { id: 'p17', x: 5, y: 40, label: '17' },
  { id: 'p18', x: 17, y: 40, label: '18' },
  { id: 'p19', x: 33, y: 40, label: '19' },
  { id: 'p20', x: 50, y: 40, label: '20' },
  { id: 'p21', x: 67, y: 40, label: '21' },
  { id: 'p22', x: 83, y: 40, label: '22' },
  { id: 'p23', x: 95, y: 40, label: '23' },
  // Row 4 (center ice)
  { id: 'p24', x: 5, y: 50, label: '24' },
  { id: 'p25', x: 25, y: 50, label: '25' },
  { id: 'p26', x: 50, y: 50, label: '26' },
  { id: 'p27', x: 75, y: 50, label: '27' },
  { id: 'p28', x: 95, y: 50, label: '28' },
  // Row 5
  { id: 'p29', x: 5, y: 60, label: '29' },
  { id: 'p30', x: 17, y: 60, label: '30' },
  { id: 'p31', x: 33, y: 60, label: '31' },
  { id: 'p32', x: 50, y: 60, label: '32' },
  { id: 'p33', x: 67, y: 60, label: '33' },
  { id: 'p34', x: 83, y: 60, label: '34' },
  { id: 'p35', x: 95, y: 60, label: '35' },
  // Row 6
  { id: 'p36', x: 5, y: 76, label: '36' },
  { id: 'p37', x: 20, y: 76, label: '37' },
  { id: 'p38', x: 35, y: 76, label: '38' },
  { id: 'p39', x: 50, y: 76, label: '39' },
  { id: 'p40', x: 65, y: 76, label: '40' },
  { id: 'p41', x: 80, y: 76, label: '41' },
  { id: 'p42', x: 95, y: 76, label: '42' },
  // Row 7 (goal crease area - bottom)
  { id: 'p43', x: 5, y: 92, label: '43' },
  { id: 'p44', x: 25, y: 92, label: '44' },
  { id: 'p45', x: 50, y: 92, label: '45' },
  { id: 'p46', x: 75, y: 92, label: '46' },
  { id: 'p47', x: 95, y: 92, label: '47' },
]

export const GRID_CONFIGS: Record<GridType, { points: MeasurementPoint[]; label: string; description: string }> = {
  '25': { points: GRID_25_POINTS, label: '25-Point Grid', description: 'Standard 5x5 measurement grid' },
  '35': { points: GRID_35_POINTS, label: '35-Point Grid', description: 'Extended 7x5 measurement grid' },
  '47': { points: GRID_47_POINTS, label: '47-Point Grid', description: 'Comprehensive NHL-style grid' },
  'custom': { points: [], label: 'Custom Diagram', description: 'Click to add measurement points' },
}

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

interface IceDepthGridProps extends Omit<FieldRenderProps, 'field'> {
  field: FieldRenderProps['field'] & {
    config?: {
      gridType?: GridType
      customPoints?: MeasurementPoint[]
    }
  }
  gridType?: GridType
  customPoints?: MeasurementPoint[]
  onCustomPointsChange?: (points: MeasurementPoint[]) => void
  allowAddPoints?: boolean
}

// Ice Depth Grid - Render mode
export function IceDepthGridFieldRender({
  field,
  value,
  onChange,
  error,
  disabled,
  gridType: propGridType,
  customPoints: propCustomPoints,
  onCustomPointsChange,
  allowAddPoints = false,
}: IceDepthGridProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const values = (value as IceDepthValue) || {}
  const stats = calculateStats(values)

  // Get grid type from props or field config
  const gridType = propGridType || field.config?.gridType || '25'
  const customPoints = propCustomPoints || field.config?.customPoints || []

  // Get points based on grid type
  const points = gridType === 'custom' ? customPoints : GRID_CONFIGS[gridType].points
  const totalPoints = points.length

  const handleValueChange = (pointId: string, newValue: string) => {
    const numValue = newValue === '' ? null : parseFloat(newValue)
    onChange({
      ...values,
      [pointId]: numValue,
    })
  }

  const handleRinkClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPoint || !allowAddPoints || gridType !== 'custom') return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPoint: MeasurementPoint = {
      id: `custom_${Date.now()}`,
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      label: String(customPoints.length + 1),
    }

    onCustomPointsChange?.([...customPoints, newPoint])
    setIsAddingPoint(false)
  }, [isAddingPoint, allowAddPoints, gridType, customPoints, onCustomPointsChange])

  const handleRemovePoint = (pointId: string) => {
    if (gridType !== 'custom' || !allowAddPoints) return

    const updatedPoints = customPoints.filter(p => p.id !== pointId)
    // Re-label points
    const relabeledPoints = updatedPoints.map((p, i) => ({ ...p, label: String(i + 1) }))
    onCustomPointsChange?.(relabeledPoints)

    // Remove value for deleted point
    const newValues = { ...values }
    delete newValues[pointId]
    onChange(newValues)
    setSelectedPoint(null)
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Custom mode toolbar */}
        {gridType === 'custom' && allowAddPoints && (
          <div className="bg-gray-100 border-b px-4 py-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAddingPoint(!isAddingPoint)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isAddingPoint
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isAddingPoint ? 'Click on rink to add point...' : '+ Add Measurement Point'}
            </button>
            {isAddingPoint && (
              <button
                type="button"
                onClick={() => setIsAddingPoint(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
            <span className="text-sm text-gray-500 ml-auto">
              {customPoints.length} point{customPoints.length !== 1 ? 's' : ''} placed
            </span>
          </div>
        )}

        {/* Rink diagram */}
        <div
          className={`relative bg-gradient-to-b from-blue-100 to-blue-200 p-4 ${
            isAddingPoint ? 'cursor-crosshair' : ''
          }`}
          style={{ aspectRatio: '2/1' }}
          onClick={handleRinkClick}
        >
          {/* Rink outline */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
            {/* Rink border with rounded ends */}
            <rect
              x="4"
              y="4"
              width="192"
              height="92"
              rx="20"
              ry="20"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              opacity="0.4"
            />
            {/* Center line */}
            <line x1="100" y1="4" x2="100" y2="96" stroke="#ef4444" strokeWidth="0.5" opacity="0.4" />
            {/* Center circle */}
            <circle cx="100" cy="50" r="15" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            {/* Blue lines */}
            <line x1="65" y1="4" x2="65" y2="96" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            <line x1="135" y1="4" x2="135" y2="96" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            {/* Goal creases */}
            <path d="M 10 40 Q 20 50 10 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
            <path d="M 190 40 Q 180 50 190 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" />
          </svg>

          {/* Measurement points */}
          {points.map((point) => {
            const pointValue = values[point.id]
            const hasValue = pointValue !== null && pointValue !== undefined

            // Color based on depth
            let bgColor = 'bg-white border-2 border-gray-300'
            if (hasValue && pointValue !== null) {
              if (pointValue < 0.75) {
                bgColor = 'bg-red-500 text-white' // Too thin
              } else if (pointValue <= 1.25) {
                bgColor = 'bg-green-500 text-white' // Optimal
              } else {
                bgColor = 'bg-yellow-500 text-white' // Too thick
              }
            }

            return (
              <button
                key={point.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPoint(point.id)
                }}
                disabled={disabled || field.disabled}
                className={`absolute w-9 h-9 -ml-4.5 -mt-4.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  selectedPoint === point.id
                    ? 'ring-4 ring-blue-400 scale-110 z-10'
                    : ''
                } ${bgColor} ${
                  !hasValue ? 'text-gray-600 hover:border-blue-400' : ''
                } ${disabled || field.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                style={{ left: `${point.x}%`, top: `${point.y}%`, marginLeft: '-18px', marginTop: '-18px' }}
                title={`Point ${point.label}: ${hasValue ? `${pointValue}"` : 'No value'}`}
              >
                {hasValue ? pointValue?.toFixed(1) : point.label}
              </button>
            )
          })}

          {/* Empty state for custom mode */}
          {gridType === 'custom' && points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-blue-600 bg-white/80 rounded-lg p-4">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm">Click &quot;Add Measurement Point&quot; then click on the rink</p>
              </div>
            </div>
          )}
        </div>

        {/* Input panel */}
        {selectedPoint && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">
                Point {points.find(p => p.id === selectedPoint)?.label}:
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="3"
                value={values[selectedPoint] ?? ''}
                onChange={(e) => handleValueChange(selectedPoint, e.target.value)}
                disabled={disabled || field.disabled}
                className="input w-24"
                placeholder="0.00"
                autoFocus
              />
              <span className="text-sm text-gray-500">inches</span>

              {/* Delete point button for custom mode */}
              {gridType === 'custom' && allowAddPoints && (
                <button
                  type="button"
                  onClick={() => handleRemovePoint(selectedPoint)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove Point
                </button>
              )}

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

        {/* Legend */}
        <div className="border-t bg-white px-4 py-2 flex items-center gap-4 text-xs">
          <span className="text-gray-500">Depth:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">&lt; 0.75&quot; (thin)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">0.75&quot; - 1.25&quot; (optimal)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">&gt; 1.25&quot; (thick)</span>
          </span>
        </div>

        {/* Statistics */}
        <div className="border-t bg-gray-50 px-4 py-3 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 uppercase">Readings</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count}/{totalPoints || '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Average</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count > 0 ? `${stats.avg.toFixed(2)}"` : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Min</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count > 0 ? `${stats.min.toFixed(2)}"` : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Max</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.count > 0 ? `${stats.max.toFixed(2)}"` : '-'}
            </div>
          </div>
        </div>
      </div>
    </FieldWrapper>
  )
}

// Grid Type Selector component
export function GridTypeSelector({
  value,
  onChange,
  disabled,
}: {
  value: GridType
  onChange: (type: GridType) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {(Object.entries(GRID_CONFIGS) as [GridType, typeof GRID_CONFIGS[GridType]][]).map(([type, config]) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          disabled={disabled}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            value === type
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="font-semibold text-gray-900">{config.label}</div>
          <div className="text-sm text-gray-500 mt-1">{config.description}</div>
          {type !== 'custom' && (
            <div className="text-xs text-blue-600 mt-2">{config.points.length} measurement points</div>
          )}
        </button>
      ))}
    </div>
  )
}

// Ice Depth Grid - Edit mode
export function IceDepthGridFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  const gridType = (field.config?.gridType as GridType) || '25'
  const config = GRID_CONFIGS[gridType]

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
            <span className="text-xs text-gray-500">{config.label} - {config.description}</span>
          </div>
        </div>
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
