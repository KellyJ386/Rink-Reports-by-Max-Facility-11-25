'use client'

import { useState, useCallback, useRef } from 'react'
import {
  MeasurementPoint,
  PRESET_RINK_25,
  PRESET_RINK_35,
  PRESET_RINK_47,
  PresetType,
} from '@/types/ice-depth'

interface CustomDiagramEditorProps {
  initialPoints?: MeasurementPoint[]
  initialPreset?: PresetType | 'CUSTOM'
  onSave: (points: MeasurementPoint[], presetType: 'CUSTOM') => void
  onCancel: () => void
  maxCustomPoints?: number
}

const PRESETS: Record<PresetType, MeasurementPoint[]> = {
  RINK_25: PRESET_RINK_25,
  RINK_35: PRESET_RINK_35,
  RINK_47: PRESET_RINK_47,
}

export default function CustomDiagramEditor({
  initialPoints = [],
  initialPreset = 'RINK_35',
  onSave,
  onCancel,
  maxCustomPoints = 60,
}: CustomDiagramEditorProps) {
  const [points, setPoints] = useState<MeasurementPoint[]>(
    initialPoints.length > 0 ? initialPoints : PRESETS[initialPreset as PresetType] || PRESET_RINK_35
  )
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [basePreset, setBasePreset] = useState<PresetType | 'CUSTOM'>(initialPreset)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPointId, setDragPointId] = useState<string | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)

  // SVG viewBox dimensions
  const viewBoxWidth = 1000
  const viewBoxHeight = 500
  const padding = 20
  const rinkWidth = viewBoxWidth - padding * 2
  const rinkHeight = viewBoxHeight - padding * 2
  const cornerRadius = 80

  // Convert SVG coordinates to percentage
  const svgToPercent = useCallback(
    (svgX: number, svgY: number) => {
      const x = Math.max(0, Math.min(100, ((svgX - padding) / rinkWidth) * 100))
      const y = Math.max(0, Math.min(100, ((svgY - padding) / rinkHeight) * 100))
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
    },
    [rinkWidth, rinkHeight]
  )

  // Get SVG coordinates from mouse event
  const getMousePosition = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return null
      const svgRect = svgRef.current.getBoundingClientRect()
      const scaleX = viewBoxWidth / svgRect.width
      const scaleY = viewBoxHeight / svgRect.height
      return {
        x: (e.clientX - svgRect.left) * scaleX,
        y: (e.clientY - svgRect.top) * scaleY,
      }
    },
    []
  )

  // Generate unique ID for new points
  const generatePointId = useCallback(() => {
    const existingIds = new Set(points.map((p) => p.id))
    let counter = 1
    while (existingIds.has(`CUSTOM_${counter}`)) {
      counter++
    }
    return `CUSTOM_${counter}`
  }, [points])

  // Generate label for new points
  const generateLabel = useCallback(() => {
    const customPoints = points.filter((p) => p.id.startsWith('CUSTOM_'))
    return `C${customPoints.length + 1}`
  }, [points])

  // Add new point on click
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isDragging || editingLabel) return

      const pos = getMousePosition(e)
      if (!pos) return

      // Check if clicking on existing point
      const clickedPoint = points.find((p) => {
        const px = padding + (p.x / 100) * rinkWidth
        const py = padding + (p.y / 100) * rinkHeight
        const distance = Math.sqrt((pos.x - px) ** 2 + (pos.y - py) ** 2)
        return distance < 20
      })

      if (clickedPoint) {
        setSelectedPoint(clickedPoint.id)
        return
      }

      // Check if within rink bounds
      if (
        pos.x < padding ||
        pos.x > viewBoxWidth - padding ||
        pos.y < padding ||
        pos.y > viewBoxHeight - padding
      ) {
        return
      }

      // Check max points
      if (points.length >= maxCustomPoints) {
        alert(`Maximum of ${maxCustomPoints} measurement points allowed`)
        return
      }

      // Add new point
      const percent = svgToPercent(pos.x, pos.y)
      const newPoint: MeasurementPoint = {
        id: generatePointId(),
        x: percent.x,
        y: percent.y,
        label: generateLabel(),
      }

      setPoints((prev) => [...prev, newPoint])
      setSelectedPoint(newPoint.id)
    },
    [
      isDragging,
      editingLabel,
      getMousePosition,
      points,
      rinkWidth,
      rinkHeight,
      maxCustomPoints,
      svgToPercent,
      generatePointId,
      generateLabel,
    ]
  )

  // Start dragging a point
  const handlePointMouseDown = useCallback(
    (e: React.MouseEvent, pointId: string) => {
      e.stopPropagation()
      setIsDragging(true)
      setDragPointId(pointId)
      setSelectedPoint(pointId)
    },
    []
  )

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging || !dragPointId) return

      const pos = getMousePosition(e)
      if (!pos) return

      const percent = svgToPercent(pos.x, pos.y)

      setPoints((prev) =>
        prev.map((p) =>
          p.id === dragPointId ? { ...p, x: percent.x, y: percent.y } : p
        )
      )
    },
    [isDragging, dragPointId, getMousePosition, svgToPercent]
  )

  // Stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragPointId(null)
  }, [])

  // Delete selected point
  const handleDeletePoint = useCallback(() => {
    if (!selectedPoint) return
    setPoints((prev) => prev.filter((p) => p.id !== selectedPoint))
    setSelectedPoint(null)
  }, [selectedPoint])

  // Start editing label
  const handleEditLabel = useCallback(() => {
    if (!selectedPoint) return
    const point = points.find((p) => p.id === selectedPoint)
    if (point) {
      setEditingLabel(selectedPoint)
      setLabelInput(point.label)
    }
  }, [selectedPoint, points])

  // Save label edit
  const handleSaveLabel = useCallback(() => {
    if (!editingLabel || !labelInput.trim()) return
    setPoints((prev) =>
      prev.map((p) =>
        p.id === editingLabel ? { ...p, label: labelInput.trim() } : p
      )
    )
    setEditingLabel(null)
    setLabelInput('')
  }, [editingLabel, labelInput])

  // Load preset
  const handleLoadPreset = useCallback((preset: PresetType) => {
    setPoints(PRESETS[preset])
    setBasePreset(preset)
    setSelectedPoint(null)
  }, [])

  // Clear all custom points (keep only preset points)
  const handleClearCustom = useCallback(() => {
    setPoints((prev) => prev.filter((p) => !p.id.startsWith('CUSTOM_')))
    setSelectedPoint(null)
  }, [])

  // Save configuration
  const handleSave = useCallback(() => {
    onSave(points, 'CUSTOM')
  }, [points, onSave])

  const selectedPointData = selectedPoint
    ? points.find((p) => p.id === selectedPoint)
    : null

  const customPointCount = points.filter((p) => p.id.startsWith('CUSTOM_')).length

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Custom Diagram Editor
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on the rink to add points, drag to move, click to select
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-600">
              {points.length} total points
            </p>
            {customPointCount > 0 && (
              <p className="text-xs text-gray-500">
                ({customPointCount} custom)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Preset Selector */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Start from:</span>
          <div className="flex gap-2">
            {(['RINK_25', 'RINK_35', 'RINK_47'] as PresetType[]).map((preset) => (
              <button
                key={preset}
                onClick={() => handleLoadPreset(preset)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  basePreset === preset && customPointCount === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset.replace('RINK_', '')} Points
              </button>
            ))}
          </div>
          {customPointCount > 0 && (
            <button
              onClick={handleClearCustom}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear Custom Points
            </button>
          )}
        </div>

        {/* SVG Rink Editor */}
        <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-auto cursor-crosshair"
            style={{ aspectRatio: `${viewBoxWidth}/${viewBoxHeight}` }}
            onClick={handleSvgClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Definitions */}
            <defs>
              <linearGradient id="iceGradientEdit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f0f9ff" />
                <stop offset="50%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#f0f9ff" />
              </linearGradient>
            </defs>

            {/* Ice Surface Background */}
            <rect
              x={padding}
              y={padding}
              width={rinkWidth}
              height={rinkHeight}
              rx={cornerRadius}
              ry={cornerRadius}
              fill="url(#iceGradientEdit)"
              stroke="#1e40af"
              strokeWidth="4"
            />

            {/* Center Red Line */}
            <line
              x1={viewBoxWidth / 2}
              y1={padding}
              x2={viewBoxWidth / 2}
              y2={viewBoxHeight - padding}
              stroke="#dc2626"
              strokeWidth="4"
            />

            {/* Blue Lines */}
            <line
              x1={padding + rinkWidth * 0.33}
              y1={padding}
              x2={padding + rinkWidth * 0.33}
              y2={viewBoxHeight - padding}
              stroke="#1e40af"
              strokeWidth="3"
            />
            <line
              x1={padding + rinkWidth * 0.67}
              y1={padding}
              x2={padding + rinkWidth * 0.67}
              y2={viewBoxHeight - padding}
              stroke="#1e40af"
              strokeWidth="3"
            />

            {/* Center Circle */}
            <circle
              cx={viewBoxWidth / 2}
              cy={viewBoxHeight / 2}
              r={60}
              fill="none"
              stroke="#1e40af"
              strokeWidth="2"
            />

            {/* Goal Creases */}
            <path
              d={`M ${padding + 30} ${viewBoxHeight / 2 - 40}
                  L ${padding + 60} ${viewBoxHeight / 2 - 40}
                  L ${padding + 60} ${viewBoxHeight / 2 + 40}
                  L ${padding + 30} ${viewBoxHeight / 2 + 40}
                  A 40 40 0 0 1 ${padding + 30} ${viewBoxHeight / 2 - 40}`}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <path
              d={`M ${viewBoxWidth - padding - 30} ${viewBoxHeight / 2 - 40}
                  L ${viewBoxWidth - padding - 60} ${viewBoxHeight / 2 - 40}
                  L ${viewBoxWidth - padding - 60} ${viewBoxHeight / 2 + 40}
                  L ${viewBoxWidth - padding - 30} ${viewBoxHeight / 2 + 40}
                  A 40 40 0 0 0 ${viewBoxWidth - padding - 30} ${viewBoxHeight / 2 - 40}`}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#2563eb"
              strokeWidth="2"
            />

            {/* Measurement Points */}
            {points.map((point) => {
              const px = padding + (point.x / 100) * rinkWidth
              const py = padding + (point.y / 100) * rinkHeight
              const isSelected = selectedPoint === point.id
              const isCustom = point.id.startsWith('CUSTOM_')
              const isDraggingThis = dragPointId === point.id

              return (
                <g
                  key={point.id}
                  className={`cursor-move ${isDraggingThis ? 'pointer-events-none' : ''}`}
                  onMouseDown={(e) => handlePointMouseDown(e, point.id)}
                >
                  {/* Point circle */}
                  <circle
                    cx={px}
                    cy={py}
                    r={isSelected ? 16 : 12}
                    fill={isCustom ? '#8b5cf6' : '#3b82f6'}
                    stroke={isSelected ? '#1f2937' : '#ffffff'}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-150"
                  />

                  {/* Label */}
                  <text
                    x={px}
                    y={py - 18}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={isCustom ? '#7c3aed' : '#1e40af'}
                    className="pointer-events-none select-none"
                  >
                    {point.label}
                  </text>

                  {/* Position indicator when selected */}
                  {isSelected && (
                    <text
                      x={px}
                      y={py + 4}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#ffffff"
                      className="pointer-events-none select-none"
                    >
                      {point.x},{point.y}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Click hint text */}
            <text
              x={viewBoxWidth / 2}
              y={viewBoxHeight - 5}
              textAnchor="middle"
              fontSize="12"
              fill="#9ca3af"
            >
              Click anywhere on the rink to add a measurement point
            </text>
          </svg>
        </div>

        {/* Selected Point Panel */}
        {selectedPointData && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-500">Selected:</span>
                  {editingLabel === selectedPoint ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
                        className="px-2 py-1 text-sm border border-blue-300 rounded w-20"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveLabel}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingLabel(null)}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="font-bold text-blue-900">
                      {selectedPointData.label}
                      {selectedPointData.id.startsWith('CUSTOM_') && (
                        <span className="ml-2 text-xs font-normal text-purple-600">
                          (custom)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500">Position:</span>
                  <p className="font-medium text-gray-700">
                    X: {selectedPointData.x}%, Y: {selectedPointData.y}%
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ID:</span>
                  <p className="font-mono text-xs text-gray-600">
                    {selectedPointData.id}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditLabel}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit Label
                </button>
                <button
                  onClick={handleDeletePoint}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Deselect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <span className="font-medium text-blue-600">Click</span> on the
              rink to add a new measurement point
            </li>
            <li>
              <span className="font-medium text-blue-600">Drag</span> points to
              reposition them
            </li>
            <li>
              <span className="font-medium text-blue-600">Click</span> on a
              point to select it, then edit or delete
            </li>
            <li>
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1 align-middle" />
              Blue points are from presets,{' '}
              <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1 align-middle" />
              Purple points are custom
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {points.length} measurement points configured
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Custom Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
