'use client'

import { useState } from 'react'
import type { FieldEditProps, FieldRenderProps, BodyDiagramMarker } from '../types'

// Edit mode component for form builder
export function BodyDiagramFieldEdit({
  field,
  isSelected,
  onSelect,
}: FieldEditProps) {
  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-2">
        <BodyIcon className="w-5 h-5 text-gray-400" />
        <span className="font-medium text-gray-700">{field.label}</span>
        {field.required && <span className="text-red-500">*</span>}
      </div>
      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
        <div className="text-center">
          <BodySilhouette className="w-24 h-40 mx-auto text-gray-300" />
          <p className="text-xs text-gray-400 mt-2">Body Diagram Field</p>
        </div>
      </div>
      {field.helpText && (
        <p className="text-xs text-gray-500 mt-2">{field.helpText}</p>
      )}
    </div>
  )
}

// Render mode component for form submission
export function BodyDiagramFieldRender({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRenderProps) {
  const markers = (value as BodyDiagramMarker[]) || []
  const config = field.bodyDiagramConfig || { view: 'front', markers: [] }
  const [activeView, setActiveView] = useState<'front' | 'back'>(
    config.view === 'back' ? 'back' : 'front'
  )
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  const handleDiagramClick = (e: React.MouseEvent<SVGElement>) => {
    if (disabled) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newMarker: BodyDiagramMarker = {
      id: `marker_${Date.now()}`,
      x,
      y,
      view: activeView,
      severity: 'minor',
    }

    onChange([...markers, newMarker])
    setSelectedMarker(newMarker.id)
  }

  const handleMarkerUpdate = (markerId: string, updates: Partial<BodyDiagramMarker>) => {
    onChange(
      markers.map((m) => (m.id === markerId ? { ...m, ...updates } : m))
    )
  }

  const handleMarkerDelete = (markerId: string) => {
    onChange(markers.filter((m) => m.id !== markerId))
    setSelectedMarker(null)
  }

  const currentViewMarkers = markers.filter((m) => m.view === activeView)
  const selectedMarkerData = markers.find((m) => m.id === selectedMarker)

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {config.view === 'both' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveView('front')}
            className={`px-3 py-1 text-sm rounded ${
              activeView === 'front'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back')}
            className={`px-3 py-1 text-sm rounded ${
              activeView === 'back'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Back View
          </button>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative bg-gray-50 rounded-lg p-4 border">
          <svg
            viewBox="0 0 100 160"
            className="w-48 h-80 cursor-crosshair"
            onClick={handleDiagramClick}
          >
            {/* Body outline */}
            <BodyOutline view={activeView} />

            {/* Markers */}
            {currentViewMarkers.map((marker) => (
              <g key={marker.id}>
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={selectedMarker === marker.id ? 4 : 3}
                  fill={getSeverityColor(marker.severity)}
                  stroke={selectedMarker === marker.id ? '#1d4ed8' : 'white'}
                  strokeWidth={selectedMarker === marker.id ? 2 : 1}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedMarker(marker.id)
                  }}
                />
                {marker.label && (
                  <text
                    x={marker.x}
                    y={marker.y - 5}
                    fontSize="4"
                    textAnchor="middle"
                    fill="#374151"
                  >
                    {marker.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
          <p className="text-xs text-gray-500 text-center mt-2">
            Click to mark injury location
          </p>
        </div>

        {/* Marker details panel */}
        {selectedMarkerData && (
          <div className="flex-1 bg-white border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Marker Details</h4>
              <button
                type="button"
                onClick={() => handleMarkerDelete(selectedMarkerData.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Label</label>
              <input
                type="text"
                value={selectedMarkerData.label || ''}
                onChange={(e) =>
                  handleMarkerUpdate(selectedMarkerData.id, { label: e.target.value })
                }
                placeholder="e.g., Left knee"
                className="input w-full text-sm"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Severity</label>
              <div className="flex gap-2">
                {(['minor', 'moderate', 'severe'] as const).map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() =>
                      handleMarkerUpdate(selectedMarkerData.id, { severity })
                    }
                    disabled={disabled}
                    className={`px-3 py-1 text-xs rounded-full capitalize ${
                      selectedMarkerData.severity === severity
                        ? severity === 'minor'
                          ? 'bg-yellow-500 text-white'
                          : severity === 'moderate'
                          ? 'bg-orange-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Minor</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Severe</span>
        </div>
      </div>

      {/* Markers summary */}
      {markers.length > 0 && (
        <div className="text-sm text-gray-600">
          {markers.length} injury location{markers.length !== 1 ? 's' : ''} marked
        </div>
      )}

      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

// SVG body outline component
function BodyOutline({ view }: { view: 'front' | 'back' }) {
  return (
    <g fill="none" stroke="#d1d5db" strokeWidth="0.5">
      {/* Head */}
      <ellipse cx="50" cy="12" rx="8" ry="10" />

      {/* Neck */}
      <line x1="50" y1="22" x2="50" y2="28" />

      {/* Torso */}
      <path d="M35 28 L65 28 L68 70 L32 70 Z" />

      {/* Arms */}
      <path d="M35 30 L20 55 L18 75" />
      <path d="M65 30 L80 55 L82 75" />

      {/* Hands */}
      <ellipse cx="18" cy="78" rx="3" ry="4" />
      <ellipse cx="82" cy="78" rx="3" ry="4" />

      {/* Legs */}
      <path d="M40 70 L38 110 L36 145" />
      <path d="M60 70 L62 110 L64 145" />

      {/* Feet */}
      <ellipse cx="34" cy="150" rx="5" ry="3" />
      <ellipse cx="66" cy="150" rx="5" ry="3" />

      {view === 'back' && (
        <>
          {/* Spine indicator for back view */}
          <line x1="50" y1="28" x2="50" y2="70" strokeDasharray="2,2" />
        </>
      )}
    </g>
  )
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case 'minor':
      return '#eab308' // yellow-500
    case 'moderate':
      return '#f97316' // orange-500
    case 'severe':
      return '#ef4444' // red-500
    default:
      return '#eab308'
  }
}

// Icon components
function BodyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )
}

function BodySilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 160" fill="currentColor">
      <ellipse cx="50" cy="12" rx="8" ry="10" />
      <rect x="35" y="25" width="30" height="45" rx="3" />
      <rect x="18" y="30" width="8" height="45" rx="2" transform="rotate(-15 22 52)" />
      <rect x="74" y="30" width="8" height="45" rx="2" transform="rotate(15 78 52)" />
      <rect x="38" y="70" width="10" height="75" rx="3" />
      <rect x="52" y="70" width="10" height="75" rx="3" />
    </svg>
  )
}

// Configuration component for form builder
export function BodyDiagramConfig({
  field,
  onUpdate,
}: {
  field: { bodyDiagramConfig?: { view: 'front' | 'back' | 'both' } }
  onUpdate: (config: { view: 'front' | 'back' | 'both' }) => void
}) {
  const config = field.bodyDiagramConfig || { view: 'front' }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Views
        </label>
        <select
          value={config.view}
          onChange={(e) =>
            onUpdate({ view: e.target.value as 'front' | 'back' | 'both' })
          }
          className="input w-full"
        >
          <option value="front">Front Only</option>
          <option value="back">Back Only</option>
          <option value="both">Both Views</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose which body views are available for marking injuries
        </p>
      </div>
    </div>
  )
}
