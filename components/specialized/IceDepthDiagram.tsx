'use client'

import { useState, useRef, useEffect } from 'react'

export interface MeasurementPoint {
  id: string
  x: number // Percentage 0-100
  y: number // Percentage 0-100
  label: string
  zone?: string // "goal_crease", "neutral", "offensive", etc.
}

interface IceDepthDiagramProps {
  rinkName?: string
  dimensions?: string // "200x85", "Olympic"
  measurementPoints: MeasurementPoint[]
  values: Record<string, number | null>
  onChange: (pointId: string, value: number | null) => void
  readOnly?: boolean
  showAverage?: boolean
  targetDepth?: number // Target ice depth in inches
  toleranceRange?: number // Acceptable variance from target
}

// Preset measurement point configurations
export const PRESET_25_POINTS: MeasurementPoint[] = [
  // Goal area - Home end
  { id: 'p1', x: 10, y: 25, label: '1', zone: 'goal_crease' },
  { id: 'p2', x: 10, y: 50, label: '2', zone: 'goal_crease' },
  { id: 'p3', x: 10, y: 75, label: '3', zone: 'goal_crease' },
  // Defensive zone
  { id: 'p4', x: 20, y: 15, label: '4', zone: 'defensive' },
  { id: 'p5', x: 20, y: 50, label: '5', zone: 'defensive' },
  { id: 'p6', x: 20, y: 85, label: '6', zone: 'defensive' },
  // Blue line - Home
  { id: 'p7', x: 30, y: 25, label: '7', zone: 'blue_line' },
  { id: 'p8', x: 30, y: 50, label: '8', zone: 'blue_line' },
  { id: 'p9', x: 30, y: 75, label: '9', zone: 'blue_line' },
  // Neutral zone
  { id: 'p10', x: 40, y: 15, label: '10', zone: 'neutral' },
  { id: 'p11', x: 40, y: 50, label: '11', zone: 'neutral' },
  { id: 'p12', x: 40, y: 85, label: '12', zone: 'neutral' },
  // Center ice
  { id: 'p13', x: 50, y: 50, label: '13', zone: 'center' },
  // Neutral zone
  { id: 'p14', x: 60, y: 15, label: '14', zone: 'neutral' },
  { id: 'p15', x: 60, y: 50, label: '15', zone: 'neutral' },
  { id: 'p16', x: 60, y: 85, label: '16', zone: 'neutral' },
  // Blue line - Away
  { id: 'p17', x: 70, y: 25, label: '17', zone: 'blue_line' },
  { id: 'p18', x: 70, y: 50, label: '18', zone: 'blue_line' },
  { id: 'p19', x: 70, y: 75, label: '19', zone: 'blue_line' },
  // Offensive zone
  { id: 'p20', x: 80, y: 15, label: '20', zone: 'offensive' },
  { id: 'p21', x: 80, y: 50, label: '21', zone: 'offensive' },
  { id: 'p22', x: 80, y: 85, label: '22', zone: 'offensive' },
  // Goal area - Away end
  { id: 'p23', x: 90, y: 25, label: '23', zone: 'goal_crease' },
  { id: 'p24', x: 90, y: 50, label: '24', zone: 'goal_crease' },
  { id: 'p25', x: 90, y: 75, label: '25', zone: 'goal_crease' },
]

export const PRESET_35_POINTS: MeasurementPoint[] = [
  ...PRESET_25_POINTS,
  // Additional corner points
  { id: 'p26', x: 15, y: 15, label: '26', zone: 'corner' },
  { id: 'p27', x: 15, y: 85, label: '27', zone: 'corner' },
  { id: 'p28', x: 85, y: 15, label: '28', zone: 'corner' },
  { id: 'p29', x: 85, y: 85, label: '29', zone: 'corner' },
  // Additional center points
  { id: 'p30', x: 50, y: 25, label: '30', zone: 'center' },
  { id: 'p31', x: 50, y: 75, label: '31', zone: 'center' },
  // Face-off circles
  { id: 'p32', x: 25, y: 35, label: '32', zone: 'faceoff' },
  { id: 'p33', x: 25, y: 65, label: '33', zone: 'faceoff' },
  { id: 'p34', x: 75, y: 35, label: '34', zone: 'faceoff' },
  { id: 'p35', x: 75, y: 65, label: '35', zone: 'faceoff' },
]

export const PRESET_47_POINTS: MeasurementPoint[] = [
  ...PRESET_35_POINTS,
  // Additional grid points
  { id: 'p36', x: 35, y: 25, label: '36', zone: 'neutral' },
  { id: 'p37', x: 35, y: 75, label: '37', zone: 'neutral' },
  { id: 'p38', x: 45, y: 25, label: '38', zone: 'neutral' },
  { id: 'p39', x: 45, y: 75, label: '39', zone: 'neutral' },
  { id: 'p40', x: 55, y: 25, label: '40', zone: 'neutral' },
  { id: 'p41', x: 55, y: 75, label: '41', zone: 'neutral' },
  { id: 'p42', x: 65, y: 25, label: '42', zone: 'neutral' },
  { id: 'p43', x: 65, y: 75, label: '43', zone: 'neutral' },
  // Board edge points
  { id: 'p44', x: 50, y: 5, label: '44', zone: 'boards' },
  { id: 'p45', x: 50, y: 95, label: '45', zone: 'boards' },
  { id: 'p46', x: 5, y: 50, label: '46', zone: 'boards' },
  { id: 'p47', x: 95, y: 50, label: '47', zone: 'boards' },
]

export default function IceDepthDiagram({
  rinkName = 'Ice Rink',
  dimensions = '200x85',
  measurementPoints,
  values,
  onChange,
  readOnly = false,
  showAverage = true,
  targetDepth = 1.25,
  toleranceRange = 0.125,
}: IceDepthDiagramProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate statistics
  const filledValues = Object.values(values).filter((v): v is number => v !== null && !isNaN(v))
  const average = filledValues.length > 0
    ? filledValues.reduce((a, b) => a + b, 0) / filledValues.length
    : null
  const min = filledValues.length > 0 ? Math.min(...filledValues) : null
  const max = filledValues.length > 0 ? Math.max(...filledValues) : null
  const range = min !== null && max !== null ? max - min : null
  const completionPercent = Math.round((filledValues.length / measurementPoints.length) * 100)

  // Get color based on value relative to target
  const getPointColor = (value: number | null): string => {
    if (value === null) return 'bg-gray-300'

    const deviation = Math.abs(value - targetDepth)
    if (deviation <= toleranceRange * 0.5) return 'bg-green-500'
    if (deviation <= toleranceRange) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Handle point click
  const handlePointClick = (pointId: string) => {
    if (readOnly) return
    setSelectedPoint(pointId)
    setInputValue(values[pointId]?.toString() || '')
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Handle input blur/submit
  const handleInputSubmit = () => {
    if (selectedPoint) {
      const numValue = parseFloat(inputValue)
      onChange(selectedPoint, isNaN(numValue) ? null : numValue)

      // Move to next point
      const currentIndex = measurementPoints.findIndex(p => p.id === selectedPoint)
      if (currentIndex < measurementPoints.length - 1) {
        const nextPoint = measurementPoints[currentIndex + 1]
        setSelectedPoint(nextPoint.id)
        setInputValue(values[nextPoint.id]?.toString() || '')
      } else {
        setSelectedPoint(null)
      }
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit()
    } else if (e.key === 'Escape') {
      setSelectedPoint(null)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleInputSubmit()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{rinkName}</h3>
          <p className="text-sm text-gray-500">{dimensions} • {measurementPoints.length} points</p>
        </div>
        {showAverage && average !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {average.toFixed(2)}"
            </div>
            <div className="text-sm text-gray-500">Average Depth</div>
          </div>
        )}
      </div>

      {/* Rink Diagram */}
      <div
        ref={containerRef}
        className="relative bg-blue-50 border-2 border-blue-200 rounded-lg overflow-hidden"
        style={{ aspectRatio: '200/85' }}
      >
        {/* Rink markings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 85"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ice surface */}
          <rect x="0" y="0" width="200" height="85" fill="#e0f2fe" />

          {/* Center line */}
          <line x1="100" y1="0" x2="100" y2="85" stroke="#dc2626" strokeWidth="0.5" />

          {/* Blue lines */}
          <line x1="60" y1="0" x2="60" y2="85" stroke="#2563eb" strokeWidth="1" />
          <line x1="140" y1="0" x2="140" y2="85" stroke="#2563eb" strokeWidth="1" />

          {/* Goal lines */}
          <line x1="20" y1="0" x2="20" y2="85" stroke="#dc2626" strokeWidth="0.5" />
          <line x1="180" y1="0" x2="180" y2="85" stroke="#dc2626" strokeWidth="0.5" />

          {/* Center circle */}
          <circle cx="100" cy="42.5" r="15" fill="none" stroke="#2563eb" strokeWidth="0.5" />
          <circle cx="100" cy="42.5" r="1" fill="#2563eb" />

          {/* Face-off circles */}
          <circle cx="40" cy="25" r="15" fill="none" stroke="#dc2626" strokeWidth="0.3" />
          <circle cx="40" cy="60" r="15" fill="none" stroke="#dc2626" strokeWidth="0.3" />
          <circle cx="160" cy="25" r="15" fill="none" stroke="#dc2626" strokeWidth="0.3" />
          <circle cx="160" cy="60" r="15" fill="none" stroke="#dc2626" strokeWidth="0.3" />

          {/* Goal creases */}
          <path d="M 10 35 A 8 8 0 0 1 10 50" fill="none" stroke="#2563eb" strokeWidth="0.5" />
          <path d="M 190 35 A 8 8 0 0 0 190 50" fill="none" stroke="#2563eb" strokeWidth="0.5" />
        </svg>

        {/* Measurement Points */}
        {measurementPoints.map((point) => {
          const value = values[point.id]
          const isSelected = selectedPoint === point.id
          const colorClass = getPointColor(value)

          return (
            <div
              key={point.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
              }`}
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
              onClick={() => handlePointClick(point.id)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2 ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-300'
                    : 'border-white'
                } ${colorClass} ${value !== null ? 'text-white' : 'text-gray-600'}`}
              >
                {value !== null ? value.toFixed(1) : point.label}
              </div>
            </div>
          )
        })}

        {/* Input Overlay */}
        {selectedPoint && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30">
            <div className="bg-white rounded-lg shadow-xl p-4 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Point {measurementPoints.find(p => p.id === selectedPoint)?.label}
              </label>
              <input
                type="number"
                step="0.01"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleInputSubmit}
                autoFocus
                placeholder="Enter depth (inches)"
                className="input text-center text-lg"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter or Tab for next point
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>On Target (±{(toleranceRange * 0.5).toFixed(3)}")</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span>Acceptable (±{toleranceRange.toFixed(3)}")</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Out of Range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
          <span>Not Measured</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{completionPercent}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">
            {average !== null ? average.toFixed(2) + '"' : '--'}
          </div>
          <div className="text-xs text-gray-500">Average</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">
            {min !== null ? min.toFixed(2) + '"' : '--'}
          </div>
          <div className="text-xs text-gray-500">Minimum</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">
            {max !== null ? max.toFixed(2) + '"' : '--'}
          </div>
          <div className="text-xs text-gray-500">Maximum</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">
            {range !== null ? range.toFixed(2) + '"' : '--'}
          </div>
          <div className="text-xs text-gray-500">Range</div>
        </div>
      </div>

      {/* Target Depth */}
      <div className="text-center text-sm text-gray-500">
        Target Depth: {targetDepth}" (±{toleranceRange}" tolerance)
      </div>
    </div>
  )
}
