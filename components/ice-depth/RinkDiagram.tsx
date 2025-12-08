'use client'

import { useState, useCallback } from 'react'
import {
  MeasurementPoint,
  IceDepthReading,
  getDepthColor,
  DEFAULT_DEPTH_TARGETS,
} from '@/types/ice-depth'

interface RinkDiagramProps {
  points: MeasurementPoint[]
  readings?: Map<string, IceDepthReading>
  onPointClick?: (point: MeasurementPoint) => void
  selectedPointId?: string | null
  showLabels?: boolean
  showValues?: boolean
  interactive?: boolean
  minDepth?: number
  maxDepth?: number
  width?: number
  height?: number
}

export default function RinkDiagram({
  points,
  readings = new Map(),
  onPointClick,
  selectedPointId,
  showLabels = true,
  showValues = true,
  interactive = true,
  minDepth = DEFAULT_DEPTH_TARGETS.min,
  maxDepth = DEFAULT_DEPTH_TARGETS.max,
  width = 800,
  height = 400,
}: RinkDiagramProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  // SVG viewBox dimensions (internal coordinate system)
  const viewBoxWidth = 1000
  const viewBoxHeight = 500

  // Rink dimensions within viewBox (with padding)
  const padding = 20
  const rinkWidth = viewBoxWidth - padding * 2
  const rinkHeight = viewBoxHeight - padding * 2
  const cornerRadius = 80

  // Calculate point position in SVG coordinates
  const getPointPosition = useCallback(
    (point: MeasurementPoint) => {
      const x = padding + (point.x / 100) * rinkWidth
      const y = padding + (point.y / 100) * rinkHeight
      return { x, y }
    },
    [rinkWidth, rinkHeight]
  )

  // Get color for a point based on its reading
  const getPointColor = useCallback(
    (pointId: string) => {
      const reading = readings.get(pointId)
      if (!reading) return '#9ca3af' // gray-400 for no reading
      return getDepthColor(reading.depth, minDepth, maxDepth)
    },
    [readings, minDepth, maxDepth]
  )

  // Handle point interaction
  const handlePointClick = useCallback(
    (point: MeasurementPoint) => {
      if (interactive && onPointClick) {
        onPointClick(point)
      }
    },
    [interactive, onPointClick]
  )

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width={width}
        height={height}
        className="w-full h-auto max-w-full"
        style={{ aspectRatio: `${viewBoxWidth}/${viewBoxHeight}` }}
      >
        {/* Definitions */}
        <defs>
          {/* Ice surface gradient */}
          <linearGradient id="iceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="50%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#f0f9ff" />
          </linearGradient>

          {/* Point glow effect */}
          <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Selected point pulse */}
          <filter id="selectedGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ice Surface Background */}
        <rect
          x={padding}
          y={padding}
          width={rinkWidth}
          height={rinkHeight}
          rx={cornerRadius}
          ry={cornerRadius}
          fill="url(#iceGradient)"
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

        {/* Blue Lines (1/3 and 2/3 of rink) */}
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
        <circle
          cx={viewBoxWidth / 2}
          cy={viewBoxHeight / 2}
          r={6}
          fill="#1e40af"
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

        {/* Goal Lines */}
        <line
          x1={padding + 50}
          y1={padding}
          x2={padding + 50}
          y2={viewBoxHeight - padding}
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <line
          x1={viewBoxWidth - padding - 50}
          y1={padding}
          x2={viewBoxWidth - padding - 50}
          y2={viewBoxHeight - padding}
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Face-off Circles */}
        {[
          { x: padding + rinkWidth * 0.2, y: viewBoxHeight / 2 - 80 },
          { x: padding + rinkWidth * 0.2, y: viewBoxHeight / 2 + 80 },
          { x: padding + rinkWidth * 0.8, y: viewBoxHeight / 2 - 80 },
          { x: padding + rinkWidth * 0.8, y: viewBoxHeight / 2 + 80 },
        ].map((circle, i) => (
          <g key={`faceoff-${i}`}>
            <circle
              cx={circle.x}
              cy={circle.y}
              r={40}
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
            />
            <circle cx={circle.x} cy={circle.y} r={4} fill="#dc2626" />
          </g>
        ))}

        {/* Measurement Points */}
        {points.map((point) => {
          const pos = getPointPosition(point)
          const reading = readings.get(point.id)
          const isSelected = selectedPointId === point.id
          const isHovered = hoveredPoint === point.id
          const color = getPointColor(point.id)
          const pointRadius = isSelected || isHovered ? 18 : 14

          return (
            <g
              key={point.id}
              className={interactive ? 'cursor-pointer' : ''}
              onClick={() => handlePointClick(point)}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Point background circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={pointRadius}
                fill={color}
                stroke={isSelected ? '#1f2937' : '#ffffff'}
                strokeWidth={isSelected ? 4 : 2}
                filter={isSelected ? 'url(#selectedGlow)' : isHovered ? 'url(#pointGlow)' : undefined}
                className="transition-all duration-150"
              />

              {/* Point label */}
              {showLabels && (
                <text
                  x={pos.x}
                  y={pos.y - pointRadius - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#374151"
                  className="pointer-events-none select-none"
                >
                  {point.label}
                </text>
              )}

              {/* Depth value inside circle */}
              {showValues && reading && (
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffffff"
                  className="pointer-events-none select-none"
                >
                  {reading.depth.toFixed(2)}
                </text>
              )}

              {/* Empty indicator */}
              {showValues && !reading && (
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#ffffff"
                  className="pointer-events-none select-none"
                >
                  -
                </text>
              )}
            </g>
          )
        })}

        {/* Zone Labels */}
        <text
          x={padding + rinkWidth * 0.16}
          y={viewBoxHeight - padding + 15}
          textAnchor="middle"
          fontSize="14"
          fill="#64748b"
          fontWeight="500"
        >
          Defensive Zone
        </text>
        <text
          x={viewBoxWidth / 2}
          y={viewBoxHeight - padding + 15}
          textAnchor="middle"
          fontSize="14"
          fill="#64748b"
          fontWeight="500"
        >
          Neutral Zone
        </text>
        <text
          x={padding + rinkWidth * 0.84}
          y={viewBoxHeight - padding + 15}
          textAnchor="middle"
          fontSize="14"
          fill="#64748b"
          fontWeight="500"
        >
          Offensive Zone
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: '#ef4444' }}
          />
          <span className="text-gray-600">Too Thin (&lt;{minDepth}&quot;)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: '#f59e0b' }}
          />
          <span className="text-gray-600">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: '#22c55e' }}
          />
          <span className="text-gray-600">Optimal</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: '#3b82f6' }}
          />
          <span className="text-gray-600">Too Thick (&gt;{maxDepth}&quot;)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: '#9ca3af' }}
          />
          <span className="text-gray-600">No Reading</span>
        </div>
      </div>

      {/* Tooltip for hovered point */}
      {hoveredPoint && (
        <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
          <p className="font-semibold">
            Point {points.find((p) => p.id === hoveredPoint)?.label}
          </p>
          {readings.get(hoveredPoint) ? (
            <p>Depth: {readings.get(hoveredPoint)?.depth.toFixed(2)}&quot;</p>
          ) : (
            <p className="text-gray-400">No reading</p>
          )}
        </div>
      )}
    </div>
  )
}
