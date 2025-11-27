'use client'

import { useState, useCallback, useRef } from 'react'

interface MeasurementPoint {
  id: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  label: string
}

interface IceDepthPointEditorProps {
  points: MeasurementPoint[]
  onChange: (points: MeasurementPoint[]) => void
  backgroundImage?: string | null
  onBackgroundChange?: (image: string | null) => void
  maxPoints?: number
}

// Standard presets for quick setup
const PRESETS = {
  RINK_25: 'Standard 25-Point Grid',
  RINK_35: 'Extended 35-Point Grid',
  RINK_47: 'Comprehensive 47-Point Grid',
  CUSTOM: 'Custom Layout',
}

// Generate preset points
function generatePreset(preset: string): MeasurementPoint[] {
  const points: MeasurementPoint[] = []

  if (preset === 'RINK_25' || preset === 'RINK_35' || preset === 'RINK_47') {
    // 5x5 base grid
    let id = 1
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        points.push({
          id: `p${id}`,
          x: 10 + col * 20,
          y: 10 + row * 20,
          label: String(id),
        })
        id++
      }
    }
  }

  if (preset === 'RINK_35' || preset === 'RINK_47') {
    // Add edge points
    let id = 26
    const edgePoints = [
      { x: 5, y: 20 }, { x: 95, y: 20 },
      { x: 5, y: 40 }, { x: 95, y: 40 },
      { x: 5, y: 60 }, { x: 95, y: 60 },
      { x: 5, y: 80 }, { x: 95, y: 80 },
      { x: 20, y: 5 }, { x: 80, y: 5 },
    ]
    edgePoints.forEach(p => {
      points.push({ id: `p${id}`, x: p.x, y: p.y, label: String(id) })
      id++
    })
  }

  if (preset === 'RINK_47') {
    // Add more internal points
    let id = 36
    const internalPoints = [
      { x: 20, y: 20 }, { x: 40, y: 20 }, { x: 60, y: 20 }, { x: 80, y: 20 },
      { x: 20, y: 40 }, { x: 40, y: 40 }, { x: 60, y: 40 }, { x: 80, y: 40 },
      { x: 20, y: 60 }, { x: 40, y: 60 }, { x: 60, y: 60 }, { x: 80, y: 60 },
    ]
    internalPoints.forEach(p => {
      points.push({ id: `p${id}`, x: p.x, y: p.y, label: String(id) })
      id++
    })
  }

  return points
}

export default function IceDepthPointEditor({
  points,
  onChange,
  backgroundImage,
  onBackgroundChange,
  maxPoints = 100,
}: IceDepthPointEditorProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePresetSelect = (preset: string) => {
    if (preset === 'CUSTOM') {
      onChange([])
    } else {
      onChange(generatePreset(preset))
    }
  }

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedPoint || editingLabel) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Check if clicking near existing point
    const clickedPoint = points.find(p =>
      Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
    )

    if (clickedPoint) {
      setSelectedPoint(clickedPoint.id)
      return
    }

    // Add new point if not at max
    if (points.length >= maxPoints) {
      alert(`Maximum ${maxPoints} points allowed`)
      return
    }

    const newId = `p${Date.now()}`
    const newLabel = String(points.length + 1)

    onChange([...points, { id: newId, x, y, label: newLabel }])
    setSelectedPoint(newId)
  }, [points, onChange, draggedPoint, editingLabel, maxPoints])

  const handlePointDragStart = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation()
    setDraggedPoint(pointId)
    setSelectedPoint(pointId)
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedPoint || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100))

    onChange(points.map(p =>
      p.id === draggedPoint ? { ...p, x, y } : p
    ))
  }, [draggedPoint, points, onChange])

  const handleMouseUp = () => {
    setDraggedPoint(null)
  }

  const handleDeletePoint = (pointId: string) => {
    onChange(points.filter(p => p.id !== pointId))
    setSelectedPoint(null)
  }

  const handleLabelDoubleClick = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation()
    const point = points.find(p => p.id === pointId)
    if (point) {
      setEditingLabel(pointId)
      setLabelInput(point.label)
    }
  }

  const handleLabelSave = () => {
    if (editingLabel && labelInput.trim()) {
      onChange(points.map(p =>
        p.id === editingLabel ? { ...p, label: labelInput.trim() } : p
      ))
    }
    setEditingLabel(null)
    setLabelInput('')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      onBackgroundChange?.(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearBackground = () => {
    onBackgroundChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const selectedPointData = points.find(p => p.id === selectedPoint)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Preset:</label>
          <select
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="input py-1 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Select preset...</option>
            {Object.entries(PRESETS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="rink-image-upload"
          />
          <label
            htmlFor="rink-image-upload"
            className="btn btn-secondary text-sm py-1 cursor-pointer"
          >
            Upload Rink Image
          </label>
          {backgroundImage && (
            <button
              onClick={clearBackground}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {points.length} / {maxPoints} points
        </div>
      </div>

      {/* Editor Canvas */}
      <div
        ref={containerRef}
        className="relative bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair select-none"
        style={{ aspectRatio: '2/1' }}
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Custom background image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Rink diagram"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}

        {/* Default rink markings (shown if no custom image) */}
        {!backgroundImage && (
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
        )}

        {/* Measurement Points */}
        {points.map((point) => (
          <div
            key={point.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            {editingLabel === point.id ? (
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onBlur={handleLabelSave}
                onKeyDown={(e) => e.key === 'Enter' && handleLabelSave()}
                className="w-10 h-6 text-center text-xs border rounded"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onMouseDown={(e) => handlePointDragStart(e, point.id)}
                onDoubleClick={(e) => handleLabelDoubleClick(e, point.id)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-medium transition-all
                  ${selectedPoint === point.id
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-2'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                  }
                  ${draggedPoint === point.id ? 'cursor-grabbing scale-110' : 'cursor-grab'}
                  shadow-lg
                `}
                title={`Point ${point.label} - Drag to move, double-click to rename`}
              >
                {point.label}
              </button>
            )}
          </div>
        ))}

        {/* Instructions overlay */}
        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-medium">Click anywhere to add measurement points</p>
              <p className="text-sm">Or select a preset from the dropdown above</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Point Info */}
      {selectedPointData && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <span className="text-sm text-gray-500">Selected:</span>
            <span className="ml-2 font-medium">Point {selectedPointData.label}</span>
            <span className="ml-4 text-sm text-gray-500">
              Position: ({selectedPointData.x.toFixed(1)}%, {selectedPointData.y.toFixed(1)}%)
            </span>
          </div>
          <button
            onClick={() => handleDeletePoint(selectedPointData.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete Point
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Click</strong> on the rink to add a new measurement point</p>
        <p><strong>Drag</strong> points to reposition them</p>
        <p><strong>Double-click</strong> a point to rename it</p>
        <p><strong>Select</strong> a point and press Delete to remove it</p>
      </div>
    </div>
  )
}
