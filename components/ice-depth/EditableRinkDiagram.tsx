'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { MeasurementPoint } from '@/types/ice-depth'

interface EditableRinkDiagramProps {
  measurementPoints: MeasurementPoint[]
  backgroundImage?: string | null
  onPointsChange: (points: MeasurementPoint[]) => void
  onBackgroundChange?: (imageData: string | null) => void
  selectedPointId?: string
  onPointSelect?: (point: MeasurementPoint | null) => void
  size?: 'md' | 'lg'
}

export default function EditableRinkDiagram({
  measurementPoints,
  backgroundImage,
  onPointsChange,
  onBackgroundChange,
  selectedPointId,
  onPointSelect,
  size = 'lg'
}: EditableRinkDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null)
  const [isPlacingPoint, setIsPlacingPoint] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  // Size configurations
  const sizeConfig = {
    md: { width: 600, height: 270 },
    lg: { width: 800, height: 360 }
  }

  const config = sizeConfig[size]
  const viewBoxWidth = 200
  const viewBoxHeight = 90
  const pointRadius = 4

  // Convert screen coordinates to viewBox coordinates
  const screenToViewBox = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 }

    const svgRect = svgRef.current.getBoundingClientRect()
    const scaleX = viewBoxWidth / svgRect.width
    const scaleY = viewBoxHeight / svgRect.height

    const viewBoxX = (clientX - svgRect.left) * scaleX
    const viewBoxY = (clientY - svgRect.top) * scaleY

    // Convert to percentage (0-100)
    const percentX = Math.max(2, Math.min(98, ((viewBoxX - 4) / (viewBoxWidth - 8)) * 100))
    const percentY = Math.max(2, Math.min(98, ((viewBoxY - 4) / (viewBoxHeight - 8)) * 100))

    return { x: Math.round(percentX), y: Math.round(percentY) }
  }, [])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedPoint) return

    const { x, y } = screenToViewBox(e.clientX, e.clientY)

    onPointsChange(
      measurementPoints.map(p =>
        p.id === draggedPoint ? { ...p, x, y } : p
      )
    )
  }, [draggedPoint, measurementPoints, onPointsChange, screenToViewBox])

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setDraggedPoint(null)
  }, [])

  // Handle click on SVG (for placing new points)
  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    if (!isPlacingPoint) return

    const { x, y } = screenToViewBox(e.clientX, e.clientY)

    // Generate a unique ID and label
    const existingLabels = measurementPoints.map(p => p.label)
    let newLabel = `P${measurementPoints.length + 1}`
    let counter = measurementPoints.length + 1
    while (existingLabels.includes(newLabel)) {
      counter++
      newLabel = `P${counter}`
    }

    const newPoint: MeasurementPoint = {
      id: `custom_${Date.now()}`,
      x,
      y,
      label: newLabel,
      zone: 'Custom'
    }

    onPointsChange([...measurementPoints, newPoint])
    setIsPlacingPoint(false)
    onPointSelect?.(newPoint)
  }, [isPlacingPoint, measurementPoints, onPointsChange, onPointSelect, screenToViewBox])

  // Handle point click
  const handlePointClick = (e: React.MouseEvent, point: MeasurementPoint) => {
    e.stopPropagation()
    if (!isPlacingPoint) {
      onPointSelect?.(selectedPointId === point.id ? null : point)
    }
  }

  // Handle point drag start
  const handlePointMouseDown = (e: React.MouseEvent, pointId: string) => {
    e.stopPropagation()
    if (!isPlacingPoint) {
      setDraggedPoint(pointId)
    }
  }

  // Delete selected point
  const deleteSelectedPoint = useCallback(() => {
    if (!selectedPointId) return
    onPointsChange(measurementPoints.filter(p => p.id !== selectedPointId))
    onPointSelect?.(null)
  }, [selectedPointId, measurementPoints, onPointsChange, onPointSelect])

  // Handle background image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onBackgroundChange?.(result)
    }
    reader.readAsDataURL(file)
  }

  // Remove background image
  const removeBackgroundImage = () => {
    onBackgroundChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Keyboard handling for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointId) {
        // Only delete if not in an input field
        if (document.activeElement?.tagName !== 'INPUT' &&
            document.activeElement?.tagName !== 'TEXTAREA') {
          deleteSelectedPoint()
        }
      }
      if (e.key === 'Escape') {
        setIsPlacingPoint(false)
        onPointSelect?.(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPointId, deleteSelectedPoint, onPointSelect])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlacingPoint(!isPlacingPoint)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isPlacingPoint
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isPlacingPoint ? '+ Click to Place Point' : '+ Add Point'}
          </button>

          {selectedPointId && (
            <button
              onClick={deleteSelectedPoint}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Delete Point
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Upload Diagram
          </button>
          {backgroundImage && (
            <button
              onClick={removeBackgroundImage}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Remove Image
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-500 text-center">
        {isPlacingPoint ? (
          <span className="text-green-600 font-medium">Click anywhere on the rink to place a new measurement point</span>
        ) : (
          <span>Drag points to reposition. Click to select, then press Delete to remove.</span>
        )}
      </div>

      {/* SVG Diagram */}
      <div className="relative border rounded-lg overflow-hidden bg-gray-100">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          width={config.width}
          height={config.height}
          className={`mx-auto block ${isPlacingPoint ? 'cursor-crosshair' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleSvgClick}
        >
          {/* Background image or default rink */}
          {backgroundImage ? (
            <image
              href={backgroundImage}
              x="0"
              y="0"
              width={viewBoxWidth}
              height={viewBoxHeight}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <>
              {/* Default rink outline with rounded corners */}
              <rect
                x="2"
                y="2"
                width={viewBoxWidth - 4}
                height={viewBoxHeight - 4}
                rx="15"
                ry="15"
                fill="#e0f2fe"
                stroke="#0ea5e9"
                strokeWidth="1"
              />

              {/* Center line */}
              <line
                x1={viewBoxWidth / 2}
                y1="2"
                x2={viewBoxWidth / 2}
                y2={viewBoxHeight - 2}
                stroke="#0ea5e9"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />

              {/* Blue lines */}
              <line
                x1={viewBoxWidth * 0.3}
                y1="2"
                x2={viewBoxWidth * 0.3}
                y2={viewBoxHeight - 2}
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <line
                x1={viewBoxWidth * 0.7}
                y1="2"
                x2={viewBoxWidth * 0.7}
                y2={viewBoxHeight - 2}
                stroke="#3b82f6"
                strokeWidth="1"
              />

              {/* Goal creases */}
              <ellipse
                cx="12"
                cy={viewBoxHeight / 2}
                rx="6"
                ry="10"
                fill="none"
                stroke="#ef4444"
                strokeWidth="0.5"
              />
              <ellipse
                cx={viewBoxWidth - 12}
                cy={viewBoxHeight / 2}
                rx="6"
                ry="10"
                fill="none"
                stroke="#ef4444"
                strokeWidth="0.5"
              />

              {/* Center circle */}
              <circle
                cx={viewBoxWidth / 2}
                cy={viewBoxHeight / 2}
                r="10"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="0.5"
              />

              {/* Face-off circles */}
              {[[viewBoxWidth * 0.2, viewBoxHeight * 0.3],
                [viewBoxWidth * 0.2, viewBoxHeight * 0.7],
                [viewBoxWidth * 0.8, viewBoxHeight * 0.3],
                [viewBoxWidth * 0.8, viewBoxHeight * 0.7]
              ].map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="8"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.3"
                />
              ))}
            </>
          )}

          {/* Measurement Points */}
          {measurementPoints.map((point) => {
            const isSelected = selectedPointId === point.id
            const isHovered = hoveredPoint === point.id
            const isDragging = draggedPoint === point.id

            // Scale point position to viewBox
            const x = (point.x / 100) * (viewBoxWidth - 8) + 4
            const y = (point.y / 100) * (viewBoxHeight - 8) + 4

            return (
              <g
                key={point.id}
                className={`cursor-move ${isDragging ? 'opacity-70' : ''}`}
                onClick={(e) => handlePointClick(e, point)}
                onMouseDown={(e) => handlePointMouseDown(e, point.id)}
                onMouseEnter={() => setHoveredPoint(point.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius + 3}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeDasharray="2,1"
                  />
                )}

                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius + 2}
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="1"
                  />
                )}

                {/* Main point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={pointRadius}
                  fill={isSelected ? '#2563eb' : '#3b82f6'}
                  stroke="#fff"
                  strokeWidth="0.5"
                />

                {/* Point label */}
                <text
                  x={x}
                  y={y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="3"
                  fontWeight="600"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {point.label}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 15}
                      y={y - pointRadius - 12}
                      width="30"
                      height="9"
                      rx="2"
                      fill="#1f2937"
                    />
                    <text
                      x={x}
                      y={y - pointRadius - 7}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize="4"
                    >
                      {point.zone || point.label} ({point.x}%, {point.y}%)
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Point count */}
      <div className="text-center text-sm text-gray-500">
        {measurementPoints.length} measurement point{measurementPoints.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
