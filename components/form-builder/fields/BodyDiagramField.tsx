'use client'

import { useState } from 'react'
import type { FormField } from '@/types/form-builder'

interface InjuryMarker {
  id: string
  x: number
  y: number
  type: string
  view: 'front' | 'back'
  notes?: string
}

interface BodyDiagramFieldProps {
  field: FormField
  value: InjuryMarker[] | undefined
  onChange: (value: InjuryMarker[]) => void
  error?: string
  disabled?: boolean
}

const DEFAULT_INJURY_TYPES = ['bruise', 'cut', 'sprain', 'fracture', 'burn', 'other']

const INJURY_COLORS: Record<string, string> = {
  bruise: 'bg-purple-500',
  cut: 'bg-red-500',
  sprain: 'bg-orange-500',
  fracture: 'bg-red-700',
  burn: 'bg-yellow-500',
  other: 'bg-gray-500',
}

export default function BodyDiagramField({
  field,
  value = [],
  onChange,
  error,
  disabled,
}: BodyDiagramFieldProps) {
  const config = field.bodyDiagramConfig
  const view = config?.view || 'front'
  const allowMultiple = config?.allowMultiple !== false
  const injuryTypes = config?.injuryTypes || DEFAULT_INJURY_TYPES

  const [activeView, setActiveView] = useState<'front' | 'back'>(view === 'both' ? 'front' : view)
  const [selectedType, setSelectedType] = useState<string>(injuryTypes[0])
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (!allowMultiple && value.length > 0) {
      // Replace existing marker
      const newMarker: InjuryMarker = {
        id: value[0].id,
        x,
        y,
        type: selectedType,
        view: activeView,
      }
      onChange([newMarker])
    } else {
      // Add new marker
      const newMarker: InjuryMarker = {
        id: `marker-${Date.now()}`,
        x,
        y,
        type: selectedType,
        view: activeView,
      }
      onChange([...value, newMarker])
    }
  }

  const handleRemoveMarker = (markerId: string) => {
    onChange(value.filter((m) => m.id !== markerId))
    setSelectedMarker(null)
  }

  const handleUpdateNotes = (markerId: string, notes: string) => {
    onChange(
      value.map((m) =>
        m.id === markerId ? { ...m, notes } : m
      )
    )
  }

  const currentViewMarkers = value.filter((m) => m.view === activeView)

  return (
    <div className={`${field.width === 'full' ? 'w-full' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* View toggle (if both views enabled) */}
        {view === 'both' && (
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveView('front')}
              className={`px-3 py-1 text-sm rounded ${
                activeView === 'front'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setActiveView('back')}
              className={`px-3 py-1 text-sm rounded ${
                activeView === 'back'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Back
            </button>
          </div>
        )}

        {/* Injury type selector */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {injuryTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                disabled={disabled}
                className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors ${
                  selectedType === type
                    ? `${INJURY_COLORS[type] || 'bg-gray-500'} text-white`
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Body diagram */}
        <div
          className="relative bg-gray-100 cursor-crosshair"
          style={{ height: '400px' }}
          onClick={handleDiagramClick}
        >
          {/* Body outline SVG */}
          <svg
            viewBox="0 0 200 400"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {activeView === 'front' ? (
              // Front view
              <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
                {/* Head */}
                <ellipse cx="100" cy="40" rx="25" ry="30" />
                {/* Neck */}
                <line x1="100" y1="70" x2="100" y2="85" />
                {/* Torso */}
                <path d="M60 85 Q60 95 65 120 L65 180 Q65 200 80 210 L120 210 Q135 200 135 180 L135 120 Q140 95 140 85 Z" />
                {/* Left arm */}
                <path d="M60 90 Q40 95 30 130 L25 180 Q23 190 30 200" />
                {/* Right arm */}
                <path d="M140 90 Q160 95 170 130 L175 180 Q177 190 170 200" />
                {/* Left leg */}
                <path d="M80 210 L75 280 L70 350 Q68 370 75 380" />
                {/* Right leg */}
                <path d="M120 210 L125 280 L130 350 Q132 370 125 380" />
              </g>
            ) : (
              // Back view
              <g fill="none" stroke="#94a3b8" strokeWidth="1.5">
                {/* Head */}
                <ellipse cx="100" cy="40" rx="25" ry="30" />
                {/* Neck */}
                <line x1="100" y1="70" x2="100" y2="85" />
                {/* Torso */}
                <path d="M60 85 Q60 95 65 120 L65 180 Q65 200 80 210 L120 210 Q135 200 135 180 L135 120 Q140 95 140 85 Z" />
                {/* Spine hint */}
                <line x1="100" y1="85" x2="100" y2="200" strokeDasharray="4,4" />
                {/* Left arm */}
                <path d="M60 90 Q40 95 30 130 L25 180 Q23 190 30 200" />
                {/* Right arm */}
                <path d="M140 90 Q160 95 170 130 L175 180 Q177 190 170 200" />
                {/* Left leg */}
                <path d="M80 210 L75 280 L70 350 Q68 370 75 380" />
                {/* Right leg */}
                <path d="M120 210 L125 280 L130 350 Q132 370 125 380" />
              </g>
            )}
          </svg>

          {/* Injury markers */}
          {currentViewMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`absolute w-6 h-6 rounded-full ${INJURY_COLORS[marker.type] || 'bg-gray-500'} border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center`}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMarker(selectedMarker === marker.id ? null : marker.id)
              }}
            >
              <span className="text-white text-xs font-bold">
                {value.indexOf(marker) + 1}
              </span>
            </div>
          ))}

          {/* View label */}
          <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-medium text-gray-600">
            {activeView === 'front' ? 'Front View' : 'Back View'}
          </div>
        </div>

        {/* Marker list */}
        {value.length > 0 && (
          <div className="border-t border-gray-200 max-h-48 overflow-y-auto">
            {value.map((marker, index) => (
              <div
                key={marker.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${
                  selectedMarker === marker.id ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full ${INJURY_COLORS[marker.type] || 'bg-gray-500'} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{marker.type}</span>
                    <span className="text-xs text-gray-400">({marker.view})</span>
                  </div>
                  <input
                    type="text"
                    value={marker.notes || ''}
                    onChange={(e) => handleUpdateNotes(marker.id, e.target.value)}
                    placeholder="Add notes..."
                    disabled={disabled}
                    className="mt-1 text-xs w-full border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-1"
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMarker(marker.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {value.length === 0 && (
          <div className="px-4 py-3 text-sm text-gray-500 text-center border-t border-gray-200">
            Click on the body diagram to mark injury locations
          </div>
        )}
      </div>

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
