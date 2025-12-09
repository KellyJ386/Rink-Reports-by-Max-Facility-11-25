'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MeasurementPoint } from '@/lib/ice-depth/types';
import { RINK_CONSTANTS } from '@/lib/ice-depth/templates';

interface TemplateEditorProps {
  initialPoints?: MeasurementPoint[];
  onSave: (points: MeasurementPoint[]) => void;
  onCancel: () => void;
  rinkId: string;
  templateName?: string;
}

type EditorMode = 'add' | 'move' | 'delete' | 'select';

export function TemplateEditor({
  initialPoints = [],
  onSave,
  onCancel,
  rinkId,
  templateName = 'Custom Template',
}: TemplateEditorProps) {
  const [points, setPoints] = useState<MeasurementPoint[]>(initialPoints);
  const [mode, setMode] = useState<EditorMode>('add');
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [draggedPointId, setDraggedPointId] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [name, setName] = useState(templateName);
  const [isSaving, setIsSaving] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

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

  // Convert screen coordinates to SVG coordinates
  const getSVGCoordinates = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    const x = ((event.clientX - rect.left) / rect.width) * (viewBox.width + 4) - 2;
    const y = ((event.clientY - rect.top) / rect.height) * (viewBox.height + 4) - 2;

    // Clamp to rink bounds with padding
    return {
      x: Math.max(3, Math.min(length - 3, x)),
      y: Math.max(3, Math.min(width - 3, y)),
    };
  }, [length, width]);

  // Get next available ID
  const getNextId = useCallback(() => {
    if (points.length === 0) return 1;
    return Math.max(...points.map(p => p.id)) + 1;
  }, [points]);

  // Determine zone based on x coordinate
  const getZoneForX = (x: number): MeasurementPoint['zone'] => {
    if (x <= 25) return 'south-goal';
    if (x <= 82) return 'south-blue';
    if (x <= 118) return 'center';
    if (x <= 175) return 'north-blue';
    return 'north-goal';
  };

  // Handle SVG click
  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // Ignore if clicking on a point
    if ((event.target as Element).closest('.editor-point')) return;

    if (mode === 'add') {
      const coords = getSVGCoordinates(event);
      const newId = getNextId();
      const newPoint: MeasurementPoint = {
        id: newId,
        x: Math.round(coords.x * 10) / 10, // Round to 1 decimal
        y: Math.round(coords.y * 10) / 10,
        label: String(newId),
        zone: getZoneForX(coords.x),
      };
      setPoints(prev => [...prev, newPoint]);
    }
  }, [mode, getSVGCoordinates, getNextId]);

  // Handle point click
  const handlePointClick = useCallback((pointId: number, event: React.MouseEvent) => {
    event.stopPropagation();

    if (mode === 'delete') {
      setPoints(prev => prev.filter(p => p.id !== pointId));
    } else if (mode === 'select' || mode === 'move') {
      setSelectedPointId(pointId === selectedPointId ? null : pointId);
    }
  }, [mode, selectedPointId]);

  // Handle point drag start
  const handleDragStart = useCallback((pointId: number, event: React.MouseEvent) => {
    if (mode !== 'move') return;
    event.preventDefault();
    setDraggedPointId(pointId);
  }, [mode]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (draggedPointId === null || mode !== 'move') return;

    const coords = getSVGCoordinates(event);
    setPoints(prev => prev.map(p =>
      p.id === draggedPointId
        ? {
            ...p,
            x: Math.round(coords.x * 10) / 10,
            y: Math.round(coords.y * 10) / 10,
            zone: getZoneForX(coords.x),
          }
        : p
    ));
  }, [draggedPointId, mode, getSVGCoordinates]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDraggedPointId(null);
  }, []);

  // Handle clear all
  const handleClearAll = () => {
    if (confirm('Clear all points? This cannot be undone.')) {
      setPoints([]);
      setSelectedPointId(null);
    }
  };

  // Renumber points sequentially
  const handleRenumber = () => {
    setPoints(prev => prev.map((p, idx) => ({
      ...p,
      id: idx + 1,
      label: String(idx + 1),
    })));
  };

  // Handle save
  const handleSave = async () => {
    if (points.length === 0) {
      alert('Please add at least one measurement point');
      return;
    }

    setIsSaving(true);
    try {
      onSave(points);
    } finally {
      setIsSaving(false);
    }
  };

  // Rink outline path
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

  // Grid lines
  const gridLines = [];
  if (showGrid) {
    for (let x = 10; x < length; x += 10) {
      gridLines.push(
        <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={width} stroke="#e5e7eb" strokeWidth="0.2" />
      );
    }
    for (let y = 10; y < width; y += 10) {
      gridLines.push(
        <line key={`h-${y}`} x1={0} y1={y} x2={length} y2={y} stroke="#e5e7eb" strokeWidth="0.2" />
      );
    }
  }

  // Mode button styles
  const getModeButtonClass = (buttonMode: EditorMode) => `
    px-4 py-2 text-sm font-medium rounded-lg transition-colors
    ${mode === buttonMode
      ? 'bg-blue-600 text-white'
      : 'bg-white text-gray-700 border hover:bg-gray-50'}
  `;

  return (
    <div className="bg-white rounded-lg border shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Custom Template Editor</h2>
          <p className="text-gray-500 text-sm">Click on the rink to add measurement points</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-600 font-medium">{points.length} points</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('add')}
            className={getModeButtonClass('add')}
            title="Add points"
          >
            + Add Point
          </button>
          <button
            onClick={() => setMode('move')}
            className={getModeButtonClass('move')}
            title="Move points"
          >
            Move
          </button>
          <button
            onClick={() => setMode('delete')}
            className={getModeButtonClass('delete')}
            title="Delete points"
          >
            Delete
          </button>
        </div>

        <div className="flex gap-2 border-l pl-4">
          <button
            onClick={handleRenumber}
            className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            Renumber
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm font-medium bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Clear All
          </button>
        </div>

        <div className="flex items-center gap-2 border-l pl-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded"
            />
            Show Grid
          </label>
        </div>
      </div>

      {/* SVG Editor */}
      <div
        className="relative border rounded-lg overflow-hidden bg-gray-100"
        style={{ cursor: mode === 'add' ? 'crosshair' : mode === 'move' ? 'move' : 'pointer' }}
      >
        <svg
          ref={svgRef}
          viewBox={`-2 -2 ${length + 4} ${width + 4}`}
          className="w-full h-auto"
          style={{ maxHeight: '50vh' }}
          onClick={handleSVGClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Rink Surface */}
          <path d={rinkOutlinePath} fill="#e8f4fc" stroke="#1e3a5f" strokeWidth="0.5" />

          {/* Grid */}
          {gridLines}

          {/* Goal Lines (red) */}
          <line x1={southGoalLine} y1={0} x2={southGoalLine} y2={width} stroke="#dc2626" strokeWidth="0.8" />
          <line x1={northGoalLine} y1={0} x2={northGoalLine} y2={width} stroke="#dc2626" strokeWidth="0.8" />

          {/* Blue Lines */}
          <line x1={southBlueLine} y1={0} x2={southBlueLine} y2={width} stroke="#1e40af" strokeWidth="1.2" />
          <line x1={northBlueLine} y1={0} x2={northBlueLine} y2={width} stroke="#1e40af" strokeWidth="1.2" />

          {/* Center Line (red, dashed) */}
          <line x1={centerLine} y1={0} x2={centerLine} y2={width} stroke="#dc2626" strokeWidth="0.8" strokeDasharray="2,2" />

          {/* Center Circle */}
          <circle cx={centerLine} cy={width / 2} r={centerCircleRadius} fill="none" stroke="#1e40af" strokeWidth="0.5" />

          {/* Face-off Circles */}
          {[{ cx: 31, cy: 22 }, { cx: 31, cy: 63 }, { cx: 169, cy: 22 }, { cx: 169, cy: 63 }].map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={faceOffCircleRadius} fill="none" stroke="#dc2626" strokeWidth="0.5" />
          ))}

          {/* Measurement Points */}
          {points.map((point) => {
            const isSelected = point.id === selectedPointId;
            const isDragged = point.id === draggedPointId;

            return (
              <g
                key={point.id}
                className="editor-point"
                onClick={(e) => handlePointClick(point.id, e)}
                onMouseDown={(e) => handleDragStart(point.id, e)}
                style={{ cursor: mode === 'move' ? 'grab' : 'pointer' }}
              >
                {/* Selection ring */}
                {(isSelected || isDragged) && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray={isDragged ? '2,1' : 'none'}
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  fill={mode === 'delete' ? '#ef4444' : '#1f2937'}
                  stroke={isSelected ? '#3b82f6' : '#fff'}
                  strokeWidth={0.5}
                />

                {/* Point number label */}
                <text
                  x={point.x}
                  y={point.y + 0.8}
                  textAnchor="middle"
                  fontSize="2.5"
                  fontWeight="bold"
                  fill="#ffffff"
                  style={{ pointerEvents: 'none' }}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-500">
        {mode === 'add' && (
          <p>Click anywhere on the rink to add a measurement point. Points are automatically numbered.</p>
        )}
        {mode === 'move' && (
          <p>Click and drag points to reposition them. Drop to set new position.</p>
        )}
        {mode === 'delete' && (
          <p>Click on any point to remove it from the template.</p>
        )}
      </div>

      {/* Point List */}
      {points.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Point Coordinates</h4>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {points.map((point) => (
              <span
                key={point.id}
                className={`text-xs px-2 py-1 rounded ${
                  point.id === selectedPointId ? 'bg-blue-100 text-blue-800' : 'bg-gray-200'
                }`}
              >
                #{point.label}: ({point.x.toFixed(1)}, {point.y.toFixed(1)})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || points.length === 0}
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
            isSaving || points.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
}

export default TemplateEditor;
