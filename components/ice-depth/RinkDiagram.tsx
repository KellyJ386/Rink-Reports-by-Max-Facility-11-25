'use client';

import React, { useCallback, useMemo } from 'react';
import {
  MeasurementPoint,
  MeasurementValue,
  DepthStatus,
  getDepthStatus,
  getStatusColor,
  DEFAULT_THRESHOLDS
} from '@/lib/ice-depth/types';
import { RINK_CONSTANTS } from '@/lib/ice-depth/templates';

interface RinkDiagramProps {
  points: MeasurementPoint[];
  measurements: Record<number, MeasurementValue>;
  selectedPointId: number | null;
  onPointClick: (point: MeasurementPoint) => void;
  showLabels?: boolean;
  className?: string;
}

export function RinkDiagram({
  points,
  measurements,
  selectedPointId,
  onPointClick,
  showLabels = true,
  className = '',
}: RinkDiagramProps) {
  const {
    length,
    width,
    southGoalLine,
    southBlueLine,
    centerLine,
    northBlueLine,
    northGoalLine,
    cornerRadius,
    goalCreaseRadius,
    faceOffCircleRadius,
    centerCircleRadius,
  } = RINK_CONSTANTS;

  // Get point status and color
  const getPointColor = useCallback((pointId: number): string => {
    const measurement = measurements[pointId];
    const status = getDepthStatus(measurement?.depth ?? null, DEFAULT_THRESHOLDS);
    return getStatusColor(status);
  }, [measurements]);

  // Create rounded rectangle path for rink outline
  const rinkOutlinePath = useMemo(() => {
    const r = cornerRadius;
    return `
      M ${r} 0
      L ${length - r} 0
      Q ${length} 0 ${length} ${r}
      L ${length} ${width - r}
      Q ${length} ${width} ${length - r} ${width}
      L ${r} ${width}
      Q 0 ${width} 0 ${width - r}
      L 0 ${r}
      Q 0 0 ${r} 0
      Z
    `;
  }, [length, width, cornerRadius]);

  // Face-off circle positions
  const faceOffCircles = useMemo(() => [
    // South end circles
    { cx: 31, cy: 22, r: faceOffCircleRadius },
    { cx: 31, cy: 63, r: faceOffCircleRadius },
    // North end circles
    { cx: 169, cy: 22, r: faceOffCircleRadius },
    { cx: 169, cy: 63, r: faceOffCircleRadius },
    // Neutral zone dots (smaller)
    { cx: 80, cy: 22, r: 1 },
    { cx: 80, cy: 63, r: 1 },
    { cx: 120, cy: 22, r: 1 },
    { cx: 120, cy: 63, r: 1 },
  ], [faceOffCircleRadius]);

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`-2 -2 ${length + 4} ${width + 4}`}
        className="w-full h-auto"
        style={{ maxHeight: '60vh' }}
      >
        {/* Rink Surface */}
        <path
          d={rinkOutlinePath}
          fill="#e8f4fc"
          stroke="#1e3a5f"
          strokeWidth="0.5"
        />

        {/* Goal Lines (red) */}
        <line
          x1={southGoalLine}
          y1={0}
          x2={southGoalLine}
          y2={width}
          stroke="#dc2626"
          strokeWidth="0.8"
        />
        <line
          x1={northGoalLine}
          y1={0}
          x2={northGoalLine}
          y2={width}
          stroke="#dc2626"
          strokeWidth="0.8"
        />

        {/* Blue Lines */}
        <line
          x1={southBlueLine}
          y1={0}
          x2={southBlueLine}
          y2={width}
          stroke="#1e40af"
          strokeWidth="1.2"
        />
        <line
          x1={northBlueLine}
          y1={0}
          x2={northBlueLine}
          y2={width}
          stroke="#1e40af"
          strokeWidth="1.2"
        />

        {/* Center Line (red, dashed) */}
        <line
          x1={centerLine}
          y1={0}
          x2={centerLine}
          y2={width}
          stroke="#dc2626"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />

        {/* Center Circle */}
        <circle
          cx={centerLine}
          cy={width / 2}
          r={centerCircleRadius}
          fill="none"
          stroke="#1e40af"
          strokeWidth="0.5"
        />
        <circle
          cx={centerLine}
          cy={width / 2}
          r={1}
          fill="#1e40af"
        />

        {/* Face-off Circles and Dots */}
        {faceOffCircles.map((circle, idx) => (
          <circle
            key={idx}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill={circle.r > 2 ? 'none' : '#dc2626'}
            stroke={circle.r > 2 ? '#dc2626' : 'none'}
            strokeWidth="0.5"
          />
        ))}

        {/* Goal Creases */}
        <path
          d={`M ${southGoalLine} ${width/2 - 4}
              A ${goalCreaseRadius} ${goalCreaseRadius} 0 0 0 ${southGoalLine} ${width/2 + 4}`}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="0.3"
        />
        <path
          d={`M ${northGoalLine} ${width/2 - 4}
              A ${goalCreaseRadius} ${goalCreaseRadius} 0 0 1 ${northGoalLine} ${width/2 + 4}`}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="0.3"
        />

        {/* Measurement Points */}
        {points.map((point) => {
          const isSelected = point.id === selectedPointId;
          const color = getPointColor(point.id);
          const hasMeasurement = measurements[point.id]?.depth !== null && measurements[point.id]?.depth !== undefined;

          return (
            <g
              key={point.id}
              onClick={() => onPointClick(point)}
              style={{ cursor: 'pointer' }}
              className="measurement-point"
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4.5}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  className="animate-pulse"
                />
              )}

              {/* Point circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={3}
                fill={color}
                stroke={isSelected ? '#1e40af' : '#1f2937'}
                strokeWidth={isSelected ? 1 : 0.5}
              />

              {/* Point number label */}
              {showLabels && (
                <text
                  x={point.x}
                  y={point.y + 0.8}
                  textAnchor="middle"
                  fontSize="2.5"
                  fontWeight="bold"
                  fill={hasMeasurement ? '#ffffff' : '#e5e7eb'}
                  style={{ pointerEvents: 'none' }}
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Zone Labels */}
        <text x={southGoalLine} y={-4} textAnchor="middle" fontSize="3" fill="#6b7280">
          South Goal
        </text>
        <text x={southBlueLine} y={-4} textAnchor="middle" fontSize="3" fill="#6b7280">
          South Blue
        </text>
        <text x={centerLine} y={-4} textAnchor="middle" fontSize="3" fill="#6b7280">
          Center
        </text>
        <text x={northBlueLine} y={-4} textAnchor="middle" fontSize="3" fill="#6b7280">
          North Blue
        </text>
        <text x={northGoalLine} y={-4} textAnchor="middle" fontSize="3" fill="#6b7280">
          North Goal
        </text>
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Ideal (25.4-44.45mm)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-800" />
          <span>Unmeasured</span>
        </div>
      </div>
    </div>
  );
}

export default RinkDiagram;
