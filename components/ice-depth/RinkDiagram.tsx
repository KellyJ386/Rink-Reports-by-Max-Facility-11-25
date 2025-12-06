'use client'

import { useState, useCallback } from 'react'
import {
  MeasurementPoint,
  PointMeasurement,
  getDepthStatus,
  DEPTH_STATUS_COLORS,
  DEFAULT_TARGET_DEPTH,
  formatDepth
} from '@/types/ice-depth'

interface RinkDiagramProps {
  measurementPoints: MeasurementPoint[]
  measurements?: PointMeasurement[]
  targetDepth?: number
  onPointClick?: (point: MeasurementPoint) => void
  selectedPointId?: string
  readOnly?: boolean
  showLabels?: boolean
  showValues?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function RinkDiagram({
  measurementPoints,
  measurements = [],
  targetDepth = DEFAULT_TARGET_DEPTH,
  onPointClick,
  selectedPointId,
  readOnly = false,
  showLabels = true,
  showValues = false,
  size = 'md'
}: RinkDiagramProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  // Get measurement for a point
  const getMeasurement = useCallback((pointId: string) => {
    return measurements.find(m => m.pointId === pointId)
  }, [measurements])

  // Get color for a point based on measurement status
  const getPointColor = useCallback((pointId: string) => {
    const measurement = getMeasurement(pointId)
    if (!measurement) return '#9ca3af' // Gray for no measurement

    const status = getDepthStatus(measurement.depth, targetDepth)
    return DEPTH_STATUS_COLORS[status]
  }, [getMeasurement, targetDepth])

  // Size configurations
  const sizeConfig = {
    sm: { width: 400, height: 180, pointRadius: 8, fontSize: 8 },
    md: { width: 600, height: 270, pointRadius: 12, fontSize: 10 },
    lg: { width: 800, height: 360, pointRadius: 16, fontSize: 12 }
  }

  const config = sizeConfig[size]

  // SVG viewBox dimensions (we'll scale the actual size)
  const viewBoxWidth = 200
  const viewBoxHeight = 90

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width={config.width}
        height={config.height}
        className="mx-auto"
      >
        {/* Rink outline with rounded corners */}
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

        {/* Blue lines (approximately at 1/3 and 2/3) */}
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

        {/* Measurement Points */}
        {measurementPoints.map((point) => {
          const measurement = getMeasurement(point.id)
          const isHovered = hoveredPoint === point.id
          const isSelected = selectedPointId === point.id
          const color = getPointColor(point.id)

          // Scale point position to viewBox
          const x = (point.x / 100) * (viewBoxWidth - 8) + 4
          const y = (point.y / 100) * (viewBoxHeight - 8) + 4

          const pointRadius = config.pointRadius / (config.width / viewBoxWidth)

          return (
            <g
              key={point.id}
              className={readOnly ? '' : 'cursor-pointer'}
              onClick={() => !readOnly && onPointClick?.(point)}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Outer ring for selected/hovered */}
              {(isSelected || isHovered) && (
                <circle
                  cx={x}
                  cy={y}
                  r={pointRadius + 2}
                  fill="none"
                  stroke={isSelected ? '#1d4ed8' : '#6b7280'}
                  strokeWidth="1"
                />
              )}

              {/* Main point circle */}
              <circle
                cx={x}
                cy={y}
                r={pointRadius}
                fill={color}
                stroke="#fff"
                strokeWidth="0.5"
              />

              {/* Point label */}
              {showLabels && (
                <text
                  x={x}
                  y={y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={config.fontSize / (config.width / viewBoxWidth)}
                  fontWeight="500"
                >
                  {point.label}
                </text>
              )}

              {/* Value display on hover */}
              {(isHovered || showValues) && measurement && (
                <g>
                  <rect
                    x={x - 10}
                    y={y - pointRadius - 10}
                    width="20"
                    height="8"
                    rx="2"
                    fill="#1f2937"
                  />
                  <text
                    x={x}
                    y={y - pointRadius - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize="5"
                    fontWeight="500"
                  >
                    {formatDepth(measurement.depth)}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEPTH_STATUS_COLORS.normal }} />
          <span className="text-gray-600">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEPTH_STATUS_COLORS.low }} />
          <span className="text-gray-600">Below Target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEPTH_STATUS_COLORS.high }} />
          <span className="text-gray-600">Above Target</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-gray-600">No Reading</span>
        </div>
      </div>
    </div>
  )
}
