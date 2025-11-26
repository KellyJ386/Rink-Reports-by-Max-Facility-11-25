'use client'

import { useState } from 'react'

interface MeasurementPoint {
  id: string
  x: number // Percentage from left
  y: number // Percentage from top
  label: string
  value?: number
}

interface IceDepthGridProps {
  points: MeasurementPoint[]
  onPointUpdate: (pointId: string, value: number | null) => void
  readOnly?: boolean
  unit?: string
}

export default function IceDepthGrid({
  points,
  onPointUpdate,
  readOnly = false,
  unit = 'in',
}: IceDepthGridProps) {
  const [activePoint, setActivePoint] = useState<string | null>(null)

  // Calculate stats
  const filledPoints = points.filter((p) => p.value !== undefined && p.value !== null)
  const avgDepth = filledPoints.length > 0
    ? filledPoints.reduce((sum, p) => sum + (p.value || 0), 0) / filledPoints.length
    : 0
  const minDepth = filledPoints.length > 0
    ? Math.min(...filledPoints.map((p) => p.value || 0))
    : 0
  const maxDepth = filledPoints.length > 0
    ? Math.max(...filledPoints.map((p) => p.value || 0))
    : 0

  const getPointColor = (value?: number) => {
    if (value === undefined || value === null) return 'bg-gray-300'
    if (value < 0.75) return 'bg-red-500' // Too thin
    if (value < 1.0) return 'bg-yellow-500' // Getting thin
    if (value > 1.5) return 'bg-blue-500' // Thick
    return 'bg-green-500' // Optimal
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex gap-4 p-3 bg-gray-100 rounded-lg text-sm">
        <div>
          <span className="text-gray-500">Measured:</span>{' '}
          <span className="font-medium">{filledPoints.length}/{points.length}</span>
        </div>
        <div>
          <span className="text-gray-500">Avg:</span>{' '}
          <span className="font-medium">{avgDepth.toFixed(2)} {unit}</span>
        </div>
        <div>
          <span className="text-gray-500">Min:</span>{' '}
          <span className="font-medium">{minDepth.toFixed(2)} {unit}</span>
        </div>
        <div>
          <span className="text-gray-500">Max:</span>{' '}
          <span className="font-medium">{maxDepth.toFixed(2)} {unit}</span>
        </div>
      </div>

      {/* Rink Diagram */}
      <div
        className="relative bg-blue-100 border-2 border-blue-300 rounded-lg"
        style={{ aspectRatio: '200/85', maxWidth: '800px' }}
      >
        {/* Rink markings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-400 opacity-50" />
          {/* Center circle */}
          <div className="absolute w-16 h-16 border-2 border-red-400 rounded-full opacity-50" />
          {/* Goal creases */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-8 border-2 border-red-400 rounded-r-lg opacity-50" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-8 border-2 border-red-400 rounded-l-lg opacity-50" />
          {/* Blue lines */}
          <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-blue-400 opacity-50" />
          <div className="absolute top-0 bottom-0 right-1/3 w-1 bg-blue-400 opacity-50" />
        </div>

        {/* Measurement Points */}
        {points.map((point) => (
          <div
            key={point.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <div className="relative group">
              {/* Point marker */}
              <button
                type="button"
                onClick={() => !readOnly && setActivePoint(activePoint === point.id ? null : point.id)}
                className={`w-8 h-8 rounded-full ${getPointColor(point.value)} text-white text-xs font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform ${
                  activePoint === point.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
              >
                {point.value?.toFixed(1) || '?'}
              </button>

              {/* Label tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {point.label}
              </div>

              {/* Input popup */}
              {activePoint === point.id && !readOnly && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-white border rounded-lg shadow-lg z-10">
                  <label className="text-xs text-gray-500 block mb-1">{point.label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="3"
                      value={point.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseFloat(e.target.value)
                        onPointUpdate(point.id, val)
                      }}
                      className="w-16 text-center border rounded py-1 text-sm"
                      autoFocus
                    />
                    <span className="text-xs text-gray-500">{unit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>&lt; 0.75{unit} (Too Thin)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />
          <span>0.75-1.0{unit} (Getting Thin)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span>1.0-1.5{unit} (Optimal)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span>&gt; 1.5{unit} (Thick)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-gray-300" />
          <span>Not Measured</span>
        </div>
      </div>
    </div>
  )
}

// Generate default measurement points for standard rink layouts
export function generateDefaultPoints(preset: '25' | '35' | '47'): MeasurementPoint[] {
  const points: MeasurementPoint[] = []

  // Grid layout based on preset
  const rows = preset === '25' ? 5 : preset === '35' ? 7 : 9
  const cols = preset === '25' ? 5 : preset === '35' ? 5 : 6

  const rowSpacing = 80 / (rows - 1)
  const colSpacing = 90 / (cols - 1)

  let count = 1
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip some corner points for 47-point layout
      if (preset === '47' && (
        (r === 0 || r === rows - 1) && (c === 0 || c === cols - 1)
      )) continue

      points.push({
        id: `p${count}`,
        x: 5 + c * colSpacing,
        y: 10 + r * rowSpacing,
        label: `Point ${count}`,
      })
      count++
    }
  }

  return points.slice(0, parseInt(preset))
}
