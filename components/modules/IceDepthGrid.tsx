'use client'

import { useState, useCallback } from 'react'

interface MeasurementPoint {
  id: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  label: string
  value?: number
}

interface IceDepthGridProps {
  presetType?: 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM'
  customPoints?: MeasurementPoint[]
  values: Record<string, number>
  onChange: (values: Record<string, number>) => void
  readOnly?: boolean
  showLabels?: boolean
}

// Standard NHL rink measurement points (25-point grid)
const PRESET_25: MeasurementPoint[] = [
  // Row 1 (behind goal)
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
  // Row 3 (center ice)
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
  // Row 5 (behind goal)
  { id: 'p21', x: 10, y: 90, label: '21' },
  { id: 'p22', x: 30, y: 90, label: '22' },
  { id: 'p23', x: 50, y: 90, label: '23' },
  { id: 'p24', x: 70, y: 90, label: '24' },
  { id: 'p25', x: 90, y: 90, label: '25' },
]

// 35-point grid adds more edge measurements
const PRESET_35: MeasurementPoint[] = [
  ...PRESET_25,
  // Additional edge points
  { id: 'p26', x: 5, y: 20, label: '26' },
  { id: 'p27', x: 95, y: 20, label: '27' },
  { id: 'p28', x: 5, y: 40, label: '28' },
  { id: 'p29', x: 95, y: 40, label: '29' },
  { id: 'p30', x: 5, y: 60, label: '30' },
  { id: 'p31', x: 95, y: 60, label: '31' },
  { id: 'p32', x: 5, y: 80, label: '32' },
  { id: 'p33', x: 95, y: 80, label: '33' },
  { id: 'p34', x: 20, y: 5, label: '34' },
  { id: 'p35', x: 80, y: 5, label: '35' },
]

// 47-point comprehensive grid
const PRESET_47: MeasurementPoint[] = [
  ...PRESET_35,
  // More internal points
  { id: 'p36', x: 20, y: 20, label: '36' },
  { id: 'p37', x: 40, y: 20, label: '37' },
  { id: 'p38', x: 60, y: 20, label: '38' },
  { id: 'p39', x: 80, y: 20, label: '39' },
  { id: 'p40', x: 20, y: 40, label: '40' },
  { id: 'p41', x: 40, y: 40, label: '41' },
  { id: 'p42', x: 60, y: 40, label: '42' },
  { id: 'p43', x: 80, y: 40, label: '43' },
  { id: 'p44', x: 20, y: 60, label: '44' },
  { id: 'p45', x: 40, y: 60, label: '45' },
  { id: 'p46', x: 60, y: 60, label: '46' },
  { id: 'p47', x: 80, y: 60, label: '47' },
]

function getPresetPoints(preset?: string): MeasurementPoint[] {
  switch (preset) {
    case 'RINK_35':
      return PRESET_35
    case 'RINK_47':
      return PRESET_47
    case 'RINK_25':
    default:
      return PRESET_25
  }
}

function getDepthColor(value: number | undefined, target: number = 1.25): string {
  if (value === undefined) return 'bg-gray-200'

  const diff = value - target
  if (Math.abs(diff) <= 0.125) return 'bg-green-500' // Good
  if (diff > 0.125) return 'bg-blue-500' // Too thick
  if (diff < -0.125 && diff >= -0.25) return 'bg-yellow-500' // Getting thin
  return 'bg-red-500' // Too thin
}

export default function IceDepthGrid({
  presetType = 'RINK_25',
  customPoints,
  values,
  onChange,
  readOnly = false,
  showLabels = true,
}: IceDepthGridProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const points = customPoints || getPresetPoints(presetType)

  const handlePointClick = useCallback((pointId: string) => {
    if (readOnly) return
    setSelectedPoint(pointId)
    setInputValue(values[pointId]?.toString() || '')
  }, [readOnly, values])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleInputBlur = useCallback(() => {
    if (selectedPoint && inputValue !== '') {
      const numValue = parseFloat(inputValue)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
        onChange({ ...values, [selectedPoint]: numValue })
      }
    }
    setSelectedPoint(null)
    setInputValue('')
  }, [selectedPoint, inputValue, values, onChange])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    } else if (e.key === 'Escape') {
      setSelectedPoint(null)
      setInputValue('')
    }
  }, [handleInputBlur])

  // Calculate stats
  const filledPoints = Object.keys(values).length
  const totalPoints = points.length
  const avgDepth = filledPoints > 0
    ? (Object.values(values).reduce((a, b) => a + b, 0) / filledPoints).toFixed(3)
    : '--'
  const minDepth = filledPoints > 0
    ? Math.min(...Object.values(values)).toFixed(3)
    : '--'
  const maxDepth = filledPoints > 0
    ? Math.max(...Object.values(values)).toFixed(3)
    : '--'

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Points:</span>
          <span className="font-medium">{filledPoints}/{totalPoints}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Avg:</span>
          <span className="font-medium">{avgDepth}"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Min:</span>
          <span className="font-medium">{minDepth}"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Max:</span>
          <span className="font-medium">{maxDepth}"</span>
        </div>
      </div>

      {/* Rink Diagram */}
      <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* Ice surface background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100" />

        {/* Rink markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
          {/* Center line */}
          <line x1="100" y1="0" x2="100" y2="100" stroke="#dc2626" strokeWidth="0.5" />
          {/* Center circle */}
          <circle cx="100" cy="50" r="15" fill="none" stroke="#2563eb" strokeWidth="0.3" />
          {/* Blue lines */}
          <line x1="65" y1="0" x2="65" y2="100" stroke="#2563eb" strokeWidth="0.5" />
          <line x1="135" y1="0" x2="135" y2="100" stroke="#2563eb" strokeWidth="0.5" />
          {/* Goal creases */}
          <path d="M 5 40 Q 15 50 5 60" fill="none" stroke="#2563eb" strokeWidth="0.3" />
          <path d="M 195 40 Q 185 50 195 60" fill="none" stroke="#2563eb" strokeWidth="0.3" />
          {/* Face-off circles */}
          <circle cx="35" cy="30" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
          <circle cx="35" cy="70" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
          <circle cx="165" cy="30" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
          <circle cx="165" cy="70" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
        </svg>

        {/* Measurement Points */}
        {points.map((point) => {
          const value = values[point.id]
          const isSelected = selectedPoint === point.id
          const color = getDepthColor(value)

          return (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              {isSelected ? (
                <input
                  type="number"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  className="w-14 h-8 text-center text-sm border-2 border-blue-500 rounded focus:outline-none"
                  step="0.125"
                  min="0"
                  max="5"
                  autoFocus
                  placeholder="0.00"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => handlePointClick(point.id)}
                  disabled={readOnly}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    text-xs font-medium transition-all
                    ${color} ${value !== undefined ? 'text-white' : 'text-gray-600'}
                    ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    shadow-sm
                  `}
                  title={`Point ${point.label}: ${value !== undefined ? `${value}"` : 'Not measured'}`}
                >
                  {showLabels ? (value !== undefined ? value.toFixed(2) : point.label) : (value !== undefined ? '✓' : '')}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Optimal (1.125"-1.375")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Thick ({">"} 1.375")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Thin (1.0"-1.125")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical ({"<"} 1.0")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <span>Not measured</span>
        </div>
      </div>

      {!readOnly && (
        <p className="text-xs text-gray-400">
          Click on a point to enter a depth measurement. Values are in inches.
        </p>
      )}
    </div>
  )
}
