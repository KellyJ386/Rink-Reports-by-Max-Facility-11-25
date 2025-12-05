'use client'

import { useState } from 'react'
import { FormField } from '@/types'

interface BodyDiagramFieldProps {
  field: FormField
  value: BodyDiagramValue
  onChange: (value: BodyDiagramValue) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export interface InjuryMarker {
  id: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  bodyPart: string
  severity: 'minor' | 'moderate' | 'severe'
  description?: string
  side: 'front' | 'back'
}

export interface BodyDiagramValue {
  markers: InjuryMarker[]
  notes?: string
}

// Body part regions for click detection
const BODY_REGIONS = {
  front: [
    { id: 'head', label: 'Head', x: 50, y: 8, width: 20, height: 12 },
    { id: 'neck', label: 'Neck', x: 50, y: 16, width: 12, height: 4 },
    { id: 'left_shoulder', label: 'Left Shoulder', x: 30, y: 22, width: 12, height: 8 },
    { id: 'right_shoulder', label: 'Right Shoulder', x: 70, y: 22, width: 12, height: 8 },
    { id: 'chest', label: 'Chest', x: 50, y: 28, width: 28, height: 12 },
    { id: 'left_arm', label: 'Left Arm', x: 22, y: 35, width: 10, height: 20 },
    { id: 'right_arm', label: 'Right Arm', x: 78, y: 35, width: 10, height: 20 },
    { id: 'abdomen', label: 'Abdomen', x: 50, y: 42, width: 24, height: 12 },
    { id: 'left_hand', label: 'Left Hand', x: 18, y: 58, width: 10, height: 10 },
    { id: 'right_hand', label: 'Right Hand', x: 82, y: 58, width: 10, height: 10 },
    { id: 'groin', label: 'Groin/Hip', x: 50, y: 54, width: 20, height: 8 },
    { id: 'left_thigh', label: 'Left Thigh', x: 40, y: 64, width: 12, height: 14 },
    { id: 'right_thigh', label: 'Right Thigh', x: 60, y: 64, width: 12, height: 14 },
    { id: 'left_knee', label: 'Left Knee', x: 40, y: 76, width: 10, height: 6 },
    { id: 'right_knee', label: 'Right Knee', x: 60, y: 76, width: 10, height: 6 },
    { id: 'left_shin', label: 'Left Shin', x: 40, y: 84, width: 10, height: 10 },
    { id: 'right_shin', label: 'Right Shin', x: 60, y: 84, width: 10, height: 10 },
    { id: 'left_foot', label: 'Left Foot', x: 40, y: 96, width: 10, height: 6 },
    { id: 'right_foot', label: 'Right Foot', x: 60, y: 96, width: 10, height: 6 },
  ],
  back: [
    { id: 'head_back', label: 'Back of Head', x: 50, y: 8, width: 20, height: 12 },
    { id: 'neck_back', label: 'Neck (Back)', x: 50, y: 16, width: 12, height: 4 },
    { id: 'upper_back', label: 'Upper Back', x: 50, y: 26, width: 28, height: 14 },
    { id: 'left_shoulder_back', label: 'Left Shoulder (Back)', x: 30, y: 22, width: 12, height: 8 },
    { id: 'right_shoulder_back', label: 'Right Shoulder (Back)', x: 70, y: 22, width: 12, height: 8 },
    { id: 'lower_back', label: 'Lower Back', x: 50, y: 42, width: 24, height: 12 },
    { id: 'left_arm_back', label: 'Left Arm (Back)', x: 22, y: 35, width: 10, height: 20 },
    { id: 'right_arm_back', label: 'Right Arm (Back)', x: 78, y: 35, width: 10, height: 20 },
    { id: 'buttocks', label: 'Buttocks', x: 50, y: 54, width: 24, height: 10 },
    { id: 'left_hamstring', label: 'Left Hamstring', x: 40, y: 66, width: 12, height: 14 },
    { id: 'right_hamstring', label: 'Right Hamstring', x: 60, y: 66, width: 12, height: 14 },
    { id: 'left_calf', label: 'Left Calf', x: 40, y: 82, width: 10, height: 12 },
    { id: 'right_calf', label: 'Right Calf', x: 60, y: 82, width: 10, height: 12 },
  ],
}

function generateMarkerId(): string {
  return `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function BodyDiagramField({
  field,
  value,
  onChange,
  error,
  disabled,
  preview,
}: BodyDiagramFieldProps) {
  const [localValue, setLocalValue] = useState<BodyDiagramValue>(
    value || { markers: [] }
  )
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front')
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [newMarkerSeverity, setNewMarkerSeverity] = useState<InjuryMarker['severity']>('moderate')

  const findBodyPart = (x: number, y: number, side: 'front' | 'back'): string => {
    const regions = BODY_REGIONS[side]
    for (const region of regions) {
      const halfWidth = region.width / 2
      const halfHeight = region.height / 2
      if (
        x >= region.x - halfWidth &&
        x <= region.x + halfWidth &&
        y >= region.y - halfHeight &&
        y <= region.y + halfHeight
      ) {
        return region.label
      }
    }
    return 'Unknown area'
  }

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || preview) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const bodyPart = findBodyPart(x, y, activeSide)

    const newMarker: InjuryMarker = {
      id: generateMarkerId(),
      x,
      y,
      bodyPart,
      severity: newMarkerSeverity,
      side: activeSide,
    }

    const newValue = {
      ...localValue,
      markers: [...localValue.markers, newMarker],
    }
    setLocalValue(newValue)
    onChange(newValue)
    setSelectedMarker(newMarker.id)
  }

  const handleRemoveMarker = (markerId: string) => {
    const newValue = {
      ...localValue,
      markers: localValue.markers.filter((m) => m.id !== markerId),
    }
    setLocalValue(newValue)
    onChange(newValue)
    if (selectedMarker === markerId) {
      setSelectedMarker(null)
    }
  }

  const handleUpdateMarkerDescription = (markerId: string, description: string) => {
    const newValue = {
      ...localValue,
      markers: localValue.markers.map((m) =>
        m.id === markerId ? { ...m, description } : m
      ),
    }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const getSeverityColor = (severity: InjuryMarker['severity']): string => {
    switch (severity) {
      case 'minor': return 'bg-yellow-400 border-yellow-600'
      case 'moderate': return 'bg-orange-400 border-orange-600'
      case 'severe': return 'bg-red-500 border-red-700'
    }
  }

  const currentMarkers = localValue.markers.filter((m) => m.side === activeSide)

  return (
    <div className="field-wrapper w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        {/* View toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            type="button"
            onClick={() => setActiveSide('front')}
            className={`px-4 py-1.5 text-sm font-medium ${
              activeSide === 'front'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setActiveSide('back')}
            className={`px-4 py-1.5 text-sm font-medium ${
              activeSide === 'back'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Back
          </button>
        </div>

        {/* Severity selector */}
        {!disabled && !preview && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Severity:</span>
            {(['minor', 'moderate', 'severe'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setNewMarkerSeverity(sev)}
                className={`px-2 py-1 text-xs rounded capitalize ${
                  newMarkerSeverity === sev
                    ? getSeverityColor(sev) + ' text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body diagram */}
      <div className="flex gap-4">
        <div
          className="relative bg-gray-100 rounded-lg flex-shrink-0 cursor-crosshair"
          style={{ width: '200px', height: '400px' }}
          onClick={handleDiagramClick}
        >
          {/* Body outline SVG */}
          <svg
            viewBox="0 0 100 200"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {/* Simple body outline */}
            <ellipse cx="50" cy="16" rx="12" ry="14" fill="#f3e8d8" stroke="#ccc" strokeWidth="0.5" />
            <rect x="38" y="28" width="24" height="4" fill="#f3e8d8" stroke="#ccc" strokeWidth="0.5" />
            <path
              d="M 38 32 L 25 40 L 22 70 L 16 110 L 20 114 L 28 110 L 32 80 L 36 50 L 38 32"
              fill="#f3e8d8"
              stroke="#ccc"
              strokeWidth="0.5"
            />
            <path
              d="M 62 32 L 75 40 L 78 70 L 84 110 L 80 114 L 72 110 L 68 80 L 64 50 L 62 32"
              fill="#f3e8d8"
              stroke="#ccc"
              strokeWidth="0.5"
            />
            <path
              d="M 38 32 L 36 50 L 34 100 L 50 108 L 66 100 L 64 50 L 62 32 Z"
              fill="#f3e8d8"
              stroke="#ccc"
              strokeWidth="0.5"
            />
            <path
              d="M 36 108 L 34 150 L 32 190 L 42 195 L 44 190 L 44 150 L 44 108"
              fill="#f3e8d8"
              stroke="#ccc"
              strokeWidth="0.5"
            />
            <path
              d="M 64 108 L 66 150 L 68 190 L 58 195 L 56 190 L 56 150 L 56 108"
              fill="#f3e8d8"
              stroke="#ccc"
              strokeWidth="0.5"
            />

            {/* Side indicator */}
            <text x="50" y="198" textAnchor="middle" fontSize="8" fill="#666">
              {activeSide === 'front' ? 'FRONT' : 'BACK'}
            </text>
          </svg>

          {/* Injury markers */}
          {currentMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`absolute w-5 h-5 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 ${getSeverityColor(marker.severity)} ${
                selectedMarker === marker.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMarker(marker.id)
              }}
              title={marker.bodyPart}
            />
          ))}

          {/* Click instruction */}
          {!disabled && !preview && localValue.markers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-gray-400 text-center px-4">
                Click to mark injury location
              </p>
            </div>
          )}
        </div>

        {/* Markers list */}
        <div className="flex-1 min-h-[200px]">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Marked Injuries ({localValue.markers.length})
          </h4>

          {localValue.markers.length === 0 ? (
            <p className="text-sm text-gray-500">No injuries marked</p>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {localValue.markers.map((marker, index) => (
                <div
                  key={marker.id}
                  className={`p-2 rounded border ${
                    selectedMarker === marker.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <span className={`w-3 h-3 rounded-full ${getSeverityColor(marker.severity)}`} />
                      <span className="text-sm font-medium">{marker.bodyPart}</span>
                      <span className="text-xs text-gray-500">({marker.side})</span>
                    </div>
                    {!disabled && !preview && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMarker(marker.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {!disabled && !preview && (
                    <input
                      type="text"
                      value={marker.description || ''}
                      onChange={(e) => handleUpdateMarkerDescription(marker.id, e.target.value)}
                      placeholder="Add description..."
                      className="mt-1 w-full text-xs px-2 py-1 border border-gray-200 rounded"
                    />
                  )}
                  {preview && marker.description && (
                    <p className="mt-1 text-xs text-gray-600">{marker.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></div>
          <span>Minor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-400 border border-orange-600"></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-red-700"></div>
          <span>Severe</span>
        </div>
      </div>

      {field.helpText && (
        <p className="mt-2 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
