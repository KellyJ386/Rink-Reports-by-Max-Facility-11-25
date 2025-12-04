'use client';

import React, { useMemo } from 'react';
import {
  MeasurementPoint,
  MeasurementValue,
  DEFAULT_THRESHOLDS,
  formatDepth,
} from '@/lib/ice-depth/types';
import { RINK_CONSTANTS } from '@/lib/ice-depth/templates';

interface HeatMapOverlayProps {
  points: MeasurementPoint[];
  measurements: Record<number, MeasurementValue>;
  showPoints?: boolean;
  showValues?: boolean;
  opacity?: number;
  className?: string;
  unit?: 'mm' | 'in';
}

// Interpolation helper for heat map
function interpolateColor(value: number, min: number, max: number): string {
  // Normalize value to 0-1 range
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Color gradient: Blue (too thin) -> Green (ideal) -> Red (too thick)
  // 0.0 = Critical thin (blue)
  // 0.25 = Warning thin (cyan)
  // 0.5 = Ideal (green)
  // 0.75 = Warning thick (yellow)
  // 1.0 = Critical thick (red)

  const idealMin = 0.3; // Normalized position of ideal min
  const idealMax = 0.7; // Normalized position of ideal max

  let r: number, g: number, b: number;

  if (normalized < idealMin) {
    // Too thin: Blue to Cyan to Green
    const t = normalized / idealMin;
    r = Math.round(0 + t * 0);
    g = Math.round(100 + t * 155);
    b = Math.round(255 - t * 155);
  } else if (normalized <= idealMax) {
    // Ideal range: Green
    r = 34;
    g = 197;
    b = 94;
  } else {
    // Too thick: Green to Yellow to Red
    const t = (normalized - idealMax) / (1 - idealMax);
    r = Math.round(34 + t * 221);
    g = Math.round(197 - t * 125);
    b = Math.round(94 - t * 94);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

// Calculate distance between two points
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Inverse Distance Weighting interpolation
function interpolateValue(
  x: number,
  y: number,
  points: MeasurementPoint[],
  measurements: Record<number, MeasurementValue>,
  power: number = 2
): number | null {
  const measuredPoints = points.filter(
    p => measurements[p.id]?.depth !== null && measurements[p.id]?.depth !== undefined
  );

  if (measuredPoints.length === 0) return null;

  let weightSum = 0;
  let valueSum = 0;

  for (const point of measuredPoints) {
    const d = distance(x, y, point.x, point.y);
    if (d < 0.1) {
      // Very close to a measured point, return its value
      return measurements[point.id].depth;
    }
    const weight = 1 / Math.pow(d, power);
    weightSum += weight;
    valueSum += weight * (measurements[point.id].depth as number);
  }

  return valueSum / weightSum;
}

export function HeatMapOverlay({
  points,
  measurements,
  showPoints = true,
  showValues = false,
  opacity = 0.6,
  className = '',
  unit = 'mm',
}: HeatMapOverlayProps) {
  const {
    length,
    width,
    southGoalLine,
    southBlueLine,
    centerLine,
    northBlueLine,
    northGoalLine,
    cornerRadius,
  } = RINK_CONSTANTS;

  // Calculate value range from measurements
  const measuredValues = useMemo(() => {
    return Object.values(measurements)
      .filter(m => m?.depth !== null && m?.depth !== undefined)
      .map(m => m.depth as number);
  }, [measurements]);

  const valueRange = useMemo(() => {
    if (measuredValues.length === 0) {
      return { min: DEFAULT_THRESHOLDS.warningMin, max: DEFAULT_THRESHOLDS.warningMax };
    }
    return {
      min: Math.min(...measuredValues, DEFAULT_THRESHOLDS.warningMin),
      max: Math.max(...measuredValues, DEFAULT_THRESHOLDS.warningMax),
    };
  }, [measuredValues]);

  // Generate heat map grid
  const heatMapCells = useMemo(() => {
    if (measuredValues.length < 2) return [];

    const cells: Array<{ x: number; y: number; width: number; height: number; color: string; value: number }> = [];
    const gridSize = 5; // Size of each grid cell in feet

    for (let x = 0; x < length; x += gridSize) {
      for (let y = 0; y < width; y += gridSize) {
        // Skip cells outside the rink corners
        const distFromCorners = [
          distance(x + gridSize/2, y + gridSize/2, 0, 0),
          distance(x + gridSize/2, y + gridSize/2, length, 0),
          distance(x + gridSize/2, y + gridSize/2, 0, width),
          distance(x + gridSize/2, y + gridSize/2, length, width),
        ];

        const inCorner = distFromCorners.some((d, i) => {
          const cornerX = i % 2 === 0 ? 0 : length;
          const cornerY = i < 2 ? 0 : width;
          const cellCenterX = x + gridSize/2;
          const cellCenterY = y + gridSize/2;

          // Check if cell is in the corner region that should be rounded
          if (i === 0 && cellCenterX < cornerRadius && cellCenterY < cornerRadius) {
            return distance(cellCenterX, cellCenterY, cornerRadius, cornerRadius) > cornerRadius;
          }
          if (i === 1 && cellCenterX > length - cornerRadius && cellCenterY < cornerRadius) {
            return distance(cellCenterX, cellCenterY, length - cornerRadius, cornerRadius) > cornerRadius;
          }
          if (i === 2 && cellCenterX < cornerRadius && cellCenterY > width - cornerRadius) {
            return distance(cellCenterX, cellCenterY, cornerRadius, width - cornerRadius) > cornerRadius;
          }
          if (i === 3 && cellCenterX > length - cornerRadius && cellCenterY > width - cornerRadius) {
            return distance(cellCenterX, cellCenterY, length - cornerRadius, width - cornerRadius) > cornerRadius;
          }
          return false;
        });

        if (inCorner) continue;

        const interpolatedValue = interpolateValue(
          x + gridSize / 2,
          y + gridSize / 2,
          points,
          measurements
        );

        if (interpolatedValue !== null) {
          cells.push({
            x,
            y,
            width: gridSize,
            height: gridSize,
            color: interpolateColor(interpolatedValue, valueRange.min, valueRange.max),
            value: interpolatedValue,
          });
        }
      }
    }

    return cells;
  }, [points, measurements, measuredValues.length, valueRange, length, width, cornerRadius]);

  // Rink outline path for clipping
  const rinkOutlinePath = `
    M ${cornerRadius} 0
    L ${length - cornerRadius} 0
    Q ${length} 0 ${length} ${cornerRadius}
    L ${length} ${width - cornerRadius}
    Q ${length} ${width} ${length - cornerRadius} ${width}
    L ${cornerRadius} ${width}
    Q 0 ${width} 0 ${width - cornerRadius}
    L 0 ${cornerRadius}
    Q 0 0 ${cornerRadius} 0
    Z
  `;

  if (measuredValues.length < 2) {
    return (
      <div className={`relative ${className}`}>
        <div className="text-center py-8 text-gray-500">
          At least 2 measurements required for heat map visualization
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`-2 -2 ${length + 4} ${width + 4}`}
        className="w-full h-auto"
        style={{ maxHeight: '60vh' }}
      >
        <defs>
          <clipPath id="rinkClip">
            <path d={rinkOutlinePath} />
          </clipPath>
        </defs>

        {/* Heat Map Layer */}
        <g clipPath="url(#rinkClip)" opacity={opacity}>
          {heatMapCells.map((cell, i) => (
            <rect
              key={i}
              x={cell.x}
              y={cell.y}
              width={cell.width}
              height={cell.height}
              fill={cell.color}
            />
          ))}
        </g>

        {/* Rink Outline */}
        <path
          d={rinkOutlinePath}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.5"
        />

        {/* Lines */}
        <line x1={southGoalLine} y1={0} x2={southGoalLine} y2={width} stroke="#dc2626" strokeWidth="0.5" opacity="0.5" />
        <line x1={northGoalLine} y1={0} x2={northGoalLine} y2={width} stroke="#dc2626" strokeWidth="0.5" opacity="0.5" />
        <line x1={southBlueLine} y1={0} x2={southBlueLine} y2={width} stroke="#1e40af" strokeWidth="0.8" opacity="0.5" />
        <line x1={northBlueLine} y1={0} x2={northBlueLine} y2={width} stroke="#1e40af" strokeWidth="0.8" opacity="0.5" />
        <line x1={centerLine} y1={0} x2={centerLine} y2={width} stroke="#dc2626" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />

        {/* Measurement Points */}
        {showPoints && points.map((point) => {
          const measurement = measurements[point.id];
          const hasValue = measurement?.depth !== null && measurement?.depth !== undefined;

          return (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={2}
                fill={hasValue ? '#fff' : '#9ca3af'}
                stroke="#1f2937"
                strokeWidth="0.3"
              />
              {showValues && hasValue && (
                <text
                  x={point.x}
                  y={point.y - 3}
                  textAnchor="middle"
                  fontSize="2"
                  fill="#1f2937"
                  fontWeight="bold"
                >
                  {formatDepth(measurement.depth, unit)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Color Scale Legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-600">
          {formatDepth(valueRange.min, unit)}
        </span>
        <div
          className="h-4 w-48 rounded"
          style={{
            background: `linear-gradient(to right,
              rgb(0, 100, 255),
              rgb(0, 200, 200),
              rgb(34, 197, 94),
              rgb(234, 179, 8),
              rgb(239, 68, 68)
            )`,
          }}
        />
        <span className="text-xs text-gray-600">
          {formatDepth(valueRange.max, unit)}
        </span>
      </div>
      <div className="flex justify-center gap-4 mt-1 text-xs text-gray-500">
        <span>Too Thin</span>
        <span>Ideal</span>
        <span>Too Thick</span>
      </div>
    </div>
  );
}

export default HeatMapOverlay;
