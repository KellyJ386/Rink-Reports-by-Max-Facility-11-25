'use client'

import { useState } from 'react'

interface InjuryMarker {
  id: string
  x: number
  y: number
  label: string
  description?: string
}

interface BodyDiagramProps {
  markers: InjuryMarker[]
  onMarkerAdd?: (marker: Omit<InjuryMarker, 'id'>) => void
  onMarkerRemove?: (markerId: string) => void
  onMarkerUpdate?: (markerId: string, description: string) => void
  readOnly?: boolean
  view: 'front' | 'back'
  onViewChange?: (view: 'front' | 'back') => void
}

// Body part regions for labeling
const bodyParts = {
  front: [
    { x: 50, y: 8, label: 'Head' },
    { x: 50, y: 18, label: 'Face' },
    { x: 50, y: 25, label: 'Neck' },
    { x: 30, y: 35, label: 'Right Shoulder' },
    { x: 70, y: 35, label: 'Left Shoulder' },
    { x: 50, y: 40, label: 'Chest' },
    { x: 20, y: 50, label: 'Right Arm' },
    { x: 80, y: 50, label: 'Left Arm' },
    { x: 50, y: 55, label: 'Abdomen' },
    { x: 15, y: 65, label: 'Right Hand' },
    { x: 85, y: 65, label: 'Left Hand' },
    { x: 50, y: 68, label: 'Hip/Pelvis' },
    { x: 35, y: 80, label: 'Right Thigh' },
    { x: 65, y: 80, label: 'Left Thigh' },
    { x: 35, y: 90, label: 'Right Knee' },
    { x: 65, y: 90, label: 'Left Knee' },
    { x: 35, y: 97, label: 'Right Lower Leg' },
    { x: 65, y: 97, label: 'Left Lower Leg' },
  ],
  back: [
    { x: 50, y: 8, label: 'Head (Back)' },
    { x: 50, y: 25, label: 'Neck (Back)' },
    { x: 30, y: 35, label: 'Right Shoulder (Back)' },
    { x: 70, y: 35, label: 'Left Shoulder (Back)' },
    { x: 50, y: 45, label: 'Upper Back' },
    { x: 50, y: 55, label: 'Lower Back' },
    { x: 50, y: 65, label: 'Buttocks' },
    { x: 35, y: 80, label: 'Right Hamstring' },
    { x: 65, y: 80, label: 'Left Hamstring' },
    { x: 35, y: 95, label: 'Right Calf' },
    { x: 65, y: 95, label: 'Left Calf' },
  ],
}

export default function BodyDiagram({
  markers,
  onMarkerAdd,
  onMarkerRemove,
  onMarkerUpdate,
  readOnly = false,
  view,
  onViewChange,
}: BodyDiagramProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onMarkerAdd) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Find nearest body part for label
    const parts = bodyParts[view]
    let nearestPart = parts[0]
    let nearestDist = Infinity

    parts.forEach((part) => {
      const dist = Math.sqrt(Math.pow(part.x - x, 2) + Math.pow(part.y - y, 2))
      if (dist < nearestDist) {
        nearestDist = dist
        nearestPart = part
      }
    })

    onMarkerAdd({
      x,
      y,
      label: nearestPart.label,
    })
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      {onViewChange && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onViewChange('front')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'front'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Front View
          </button>
          <button
            type="button"
            onClick={() => onViewChange('back')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'back'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Back View
          </button>
        </div>
      )}

      {/* Body Diagram */}
      <div
        className={`relative mx-auto bg-gray-50 border-2 border-gray-200 rounded-lg ${
          readOnly ? '' : 'cursor-crosshair'
        }`}
        style={{ width: '300px', height: '500px' }}
        onClick={handleClick}
      >
        {/* Body Outline SVG */}
        <svg
          viewBox="0 0 100 160"
          className="absolute inset-0 w-full h-full pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.3"
        >
          {view === 'front' ? (
            <>
              {/* Head */}
              <ellipse cx="50" cy="15" rx="12" ry="14" />
              {/* Neck */}
              <rect x="45" y="28" width="10" height="8" />
              {/* Torso */}
              <path d="M30 36 Q25 60 35 100 L65 100 Q75 60 70 36 Z" />
              {/* Arms */}
              <path d="M30 36 Q15 50 10 80 Q8 90 15 100" />
              <path d="M70 36 Q85 50 90 80 Q92 90 85 100" />
              {/* Legs */}
              <path d="M35 100 Q30 130 30 155" />
              <path d="M65 100 Q70 130 70 155" />
            </>
          ) : (
            <>
              {/* Head */}
              <ellipse cx="50" cy="15" rx="12" ry="14" />
              {/* Neck */}
              <rect x="45" y="28" width="10" height="8" />
              {/* Torso (back) */}
              <path d="M30 36 Q28 60 35 100 L65 100 Q72 60 70 36 Z" />
              {/* Arms */}
              <path d="M30 36 Q15 50 10 80 Q8 90 15 100" />
              <path d="M70 36 Q85 50 90 80 Q92 90 85 100" />
              {/* Legs */}
              <path d="M35 100 Q30 130 30 155" />
              <path d="M65 100 Q70 130 70 155" />
            </>
          )}
        </svg>

        {/* Injury Markers */}
        {markers
          .filter(() => true) // Show all markers for now
          .map((marker) => (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            >
              <div className="relative group">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveMarker(activeMarker === marker.id ? null : marker.id)
                  }}
                  className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold hover:bg-red-600"
                >
                  !
                </button>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {marker.label}
                </div>

                {/* Detail Panel */}
                {activeMarker === marker.id && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-white border rounded-lg shadow-lg z-20 w-48"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-medium text-sm mb-2">{marker.label}</p>
                    {!readOnly && onMarkerUpdate ? (
                      <>
                        <textarea
                          value={marker.description || ''}
                          onChange={(e) => onMarkerUpdate(marker.id, e.target.value)}
                          placeholder="Describe the injury..."
                          className="w-full text-xs border rounded p-1 mb-2"
                          rows={2}
                        />
                        <button
                          type="button"
                          onClick={() => onMarkerRemove?.(marker.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove marker
                        </button>
                      </>
                    ) : (
                      marker.description && (
                        <p className="text-xs text-gray-600">{marker.description}</p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Instructions */}
        {!readOnly && markers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-sm text-center px-4">
              Click on the body to mark injury locations
            </p>
          </div>
        )}
      </div>

      {/* Marker Count */}
      <p className="text-center text-sm text-gray-500">
        {markers.length} injury location{markers.length !== 1 ? 's' : ''} marked
      </p>
    </div>
  )
}
