'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  MeasurementPoint,
  MeasurementValue,
  getDepthStatus,
  getStatusColor,
  DEFAULT_THRESHOLDS,
  formatDepth,
} from '@/lib/ice-depth/types';
import { RINK_CONSTANTS } from '@/lib/ice-depth/templates';

interface MobileRinkDiagramProps {
  points: MeasurementPoint[];
  measurements: Record<number, MeasurementValue>;
  selectedPointId: number | null;
  onPointClick: (point: MeasurementPoint) => void;
  showLabels?: boolean;
  unit?: 'mm' | 'in';
  className?: string;
}

interface TouchState {
  lastDistance: number;
  lastCenter: { x: number; y: number };
  isPinching: boolean;
}

export function MobileRinkDiagram({
  points,
  measurements,
  selectedPointId,
  onPointClick,
  showLabels = true,
  unit = 'mm',
  className = '',
}: MobileRinkDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchStateRef = useRef<TouchState>({
    lastDistance: 0,
    lastCenter: { x: 0, y: 0 },
    isPinching: false,
  });

  const {
    length,
    width,
    southGoalLine,
    southBlueLine,
    centerLine,
    northBlueLine,
    northGoalLine,
    cornerRadius,
    faceOffCircleRadius,
    centerCircleRadius,
  } = RINK_CONSTANTS;

  // Get point status and color
  const getPointColor = useCallback((pointId: number): string => {
    const measurement = measurements[pointId];
    const status = getDepthStatus(measurement?.depth ?? null, DEFAULT_THRESHOLDS);
    return getStatusColor(status);
  }, [measurements]);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchStateRef.current = {
        lastDistance: getTouchDistance(e.touches),
        lastCenter: getTouchCenter(e.touches),
        isPinching: true,
      };
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      touchStateRef.current.lastCenter = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      e.preventDefault();

      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);

      // Calculate scale change
      const scaleChange = newDistance / touchStateRef.current.lastDistance;
      const newScale = Math.max(1, Math.min(4, scale * scaleChange));

      // Calculate translation to zoom toward pinch center
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = newCenter.x - rect.left - rect.width / 2;
        const centerY = newCenter.y - rect.top - rect.height / 2;

        const dx = centerX - touchStateRef.current.lastCenter.x;
        const dy = centerY - touchStateRef.current.lastCenter.y;

        setTranslate(prev => ({
          x: prev.x + dx * 0.5,
          y: prev.y + dy * 0.5,
        }));
      }

      setScale(newScale);
      touchStateRef.current.lastDistance = newDistance;
      touchStateRef.current.lastCenter = newCenter;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const dx = e.touches[0].clientX - touchStateRef.current.lastCenter.x;
      const dy = e.touches[0].clientY - touchStateRef.current.lastCenter.y;

      setTranslate(prev => ({
        x: Math.max(-100, Math.min(100, prev.x + dx * 0.5)),
        y: Math.max(-50, Math.min(50, prev.y + dy * 0.5)),
      }));

      touchStateRef.current.lastCenter = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, [scale, isDragging]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    touchStateRef.current.isPinching = false;
    setIsDragging(false);

    // Reset transform if scale is back to 1
    if (scale <= 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale]);

  // Double tap to reset zoom
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
    lastTapRef.current = now;
  }, []);

  // Handle point tap
  const handlePointTap = useCallback((point: MeasurementPoint, e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    // Provide haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onPointClick(point);
  }, [onPointClick]);

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

  // Face-off circles
  const faceOffCircles = useMemo(() => [
    { cx: 31, cy: 22, r: faceOffCircleRadius },
    { cx: 31, cy: 63, r: faceOffCircleRadius },
    { cx: 169, cy: 22, r: faceOffCircleRadius },
    { cx: 169, cy: 63, r: faceOffCircleRadius },
  ], [faceOffCircleRadius]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-2 right-2 z-10 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Reset zoom button */}
      {scale > 1 && (
        <button
          onClick={() => {
            setScale(1);
            setTranslate({ x: 0, y: 0 });
          }}
          className="absolute top-2 left-2 z-10 bg-blue-600 text-white px-3 py-1 rounded text-xs"
        >
          Reset
        </button>
      )}

      <div
        ref={containerRef}
        className="touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging || touchStateRef.current.isPinching ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        <svg
          viewBox={`-2 -2 ${length + 4} ${width + 4}`}
          className="w-full h-auto"
          style={{ maxHeight: '50vh' }}
        >
          {/* Rink Surface */}
          <path
            d={rinkOutlinePath}
            fill="#e8f4fc"
            stroke="#1e3a5f"
            strokeWidth="0.5"
          />

          {/* Goal Lines */}
          <line x1={southGoalLine} y1={0} x2={southGoalLine} y2={width} stroke="#dc2626" strokeWidth="0.8" />
          <line x1={northGoalLine} y1={0} x2={northGoalLine} y2={width} stroke="#dc2626" strokeWidth="0.8" />

          {/* Blue Lines */}
          <line x1={southBlueLine} y1={0} x2={southBlueLine} y2={width} stroke="#1e40af" strokeWidth="1.2" />
          <line x1={northBlueLine} y1={0} x2={northBlueLine} y2={width} stroke="#1e40af" strokeWidth="1.2" />

          {/* Center Line */}
          <line x1={centerLine} y1={0} x2={centerLine} y2={width} stroke="#dc2626" strokeWidth="0.8" strokeDasharray="2,2" />

          {/* Center Circle */}
          <circle cx={centerLine} cy={width / 2} r={centerCircleRadius} fill="none" stroke="#1e40af" strokeWidth="0.5" />

          {/* Face-off Circles */}
          {faceOffCircles.map((circle, idx) => (
            <circle key={idx} cx={circle.cx} cy={circle.cy} r={circle.r} fill="none" stroke="#dc2626" strokeWidth="0.5" />
          ))}

          {/* Measurement Points - Larger touch targets for mobile */}
          {points.map((point) => {
            const isSelected = point.id === selectedPointId;
            const color = getPointColor(point.id);
            const hasMeasurement = measurements[point.id]?.depth !== null && measurements[point.id]?.depth !== undefined;
            const measurement = measurements[point.id];

            // Larger touch target
            const touchRadius = 5;

            return (
              <g
                key={point.id}
                onClick={(e) => handlePointTap(point, e)}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleDoubleTap(e);
                  handlePointTap(point, e);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible larger touch target */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={touchRadius}
                  fill="transparent"
                />

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={4.5}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1"
                  >
                    <animate
                      attributeName="r"
                      values="4;5;4"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Point circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
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

                {/* Value label when zoomed */}
                {scale > 1.5 && hasMeasurement && (
                  <text
                    x={point.x}
                    y={point.y - 5}
                    textAnchor="middle"
                    fontSize="2"
                    fill="#1f2937"
                    style={{ pointerEvents: 'none' }}
                  >
                    {formatDepth(measurement.depth, unit)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Ideal</span>
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
          <span>Pending</span>
        </div>
      </div>

      {/* Touch instructions */}
      <p className="text-center text-xs text-gray-400 mt-2">
        Pinch to zoom | Double tap to reset | Tap points to measure
      </p>
    </div>
  );
}

export default MobileRinkDiagram;
