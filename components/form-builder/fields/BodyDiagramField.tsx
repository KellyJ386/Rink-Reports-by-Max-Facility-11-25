'use client'

import { useState } from 'react'
import { FormField, BodyDiagramConfig, BodyMarker } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface BodyDiagramFieldProps {
  field: FormField
  value?: BodyMarker[]
  onChange?: (value: BodyMarker[]) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function BodyDiagramField({
  field,
  value = [],
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: BodyDiagramFieldProps) {
  const config = field.bodyDiagramConfig
  const [selectedMarkerType, setSelectedMarkerType] = useState<string | null>(
    config?.markerTypes[0]?.id ?? null
  )
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front')

  if (!config) {
    return (
      <FieldWrapper
        field={field}
        error={error}
        isBuilder={isBuilder}
        isSelected={isSelected}
        onClick={onClick}
      >
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Body diagram not configured</p>
        </div>
      </FieldWrapper>
    )
  }

  const handleDiagramClick = (
    e: React.MouseEvent<HTMLDivElement>,
    view: 'front' | 'back'
  ) => {
    if (disabled || isBuilder || !selectedMarkerType) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // If not allowing multiple markers, clear existing markers of this type
    let newMarkers = [...value]
    if (!config.allowMultipleMarkers) {
      newMarkers = newMarkers.filter((m) => m.typeId !== selectedMarkerType)
    }

    const newMarker: BodyMarker = {
      id: Math.random().toString(36).substring(2, 11),
      typeId: selectedMarkerType,
      x,
      y,
      view,
    }

    onChange?.([...newMarkers, newMarker])
  }

  const handleRemoveMarker = (markerId: string) => {
    onChange?.(value.filter((m) => m.id !== markerId))
    setSelectedMarker(null)
  }

  const handleUpdateMarkerNotes = (markerId: string, notes: string) => {
    onChange?.(
      value.map((m) => (m.id === markerId ? { ...m, notes } : m))
    )
  }

  const getMarkerColor = (typeId: string) => {
    return config.markerTypes.find((t) => t.id === typeId)?.color ?? '#3b82f6'
  }

  const getMarkerLabel = (typeId: string) => {
    return config.markerTypes.find((t) => t.id === typeId)?.label ?? 'Unknown'
  }

  const viewsToShow = config.view === 'both' ? ['front', 'back'] as const : [config.view] as const

  const renderBodyOutline = (view: 'front' | 'back') => (
    <svg
      viewBox="0 0 100 200"
      className="w-full h-full"
      style={{ pointerEvents: 'none' }}
    >
      {/* Simple body outline */}
      <ellipse cx="50" cy="20" rx="15" ry="18" fill="none" stroke="#d1d5db" strokeWidth="1" />
      {/* Head */}
      <path
        d="M35 40 L35 100 L25 100 L25 130 L35 130 L35 150 L30 200 L40 200 L50 160 L60 200 L70 200 L65 150 L65 130 L75 130 L75 100 L65 100 L65 40 Z"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      {/* Label */}
      <text x="50" y="195" textAnchor="middle" fontSize="8" fill="#9ca3af">
        {view === 'front' ? 'Front' : 'Back'}
      </text>
    </svg>
  )

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Marker type selector */}
        {!isBuilder && config.markerTypes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {config.markerTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedMarkerType(type.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedMarkerType === type.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                {type.label}
              </button>
            ))}
          </div>
        )}

        {/* View toggle for 'both' mode */}
        {config.view === 'both' && !isBuilder && (
          <div className="flex gap-2">
            {(['front', 'back'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1 text-sm rounded ${
                  currentView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {view === 'front' ? 'Front View' : 'Back View'}
              </button>
            ))}
          </div>
        )}

        {/* Body diagrams */}
        <div className={`flex gap-4 ${config.view === 'both' && isBuilder ? '' : 'justify-center'}`}>
          {(isBuilder ? viewsToShow : [currentView]).map((view) => (
            <div
              key={view}
              className={`relative ${config.view === 'both' ? 'w-1/2' : 'w-48'} aspect-[1/2] bg-gray-50 border border-gray-200 rounded-lg overflow-hidden ${
                disabled || isBuilder ? 'cursor-not-allowed' : 'cursor-crosshair'
              }`}
              onClick={(e) => handleDiagramClick(e, view)}
            >
              {renderBodyOutline(view)}

              {/* Markers */}
              {value
                .filter((m) => m.view === view)
                .map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    disabled={disabled || isBuilder}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedMarker(marker.id)
                    }}
                    className={`absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125 ${
                      selectedMarker === marker.id ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                    }`}
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      backgroundColor: getMarkerColor(marker.typeId),
                    }}
                    title={getMarkerLabel(marker.typeId)}
                  />
                ))}
            </div>
          ))}
        </div>

        {/* Selected marker details */}
        {selectedMarker && !isBuilder && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {getMarkerLabel(value.find((m) => m.id === selectedMarker)?.typeId ?? '')}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveMarker(selectedMarker)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
            <textarea
              value={value.find((m) => m.id === selectedMarker)?.notes ?? ''}
              onChange={(e) => handleUpdateMarkerNotes(selectedMarker, e.target.value)}
              placeholder="Add notes about this injury..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Marker summary */}
        {!isBuilder && value.length > 0 && (
          <div className="text-xs text-gray-500">
            {value.length} marker{value.length !== 1 ? 's' : ''} placed
          </div>
        )}

        {/* Instructions */}
        {!isBuilder && !disabled && (
          <p className="text-xs text-gray-500">
            Select a marker type above, then click on the body to place markers.
          </p>
        )}

        {/* Builder placeholder */}
        {isBuilder && (
          <p className="text-xs text-gray-500 text-center">
            {config.markerTypes.length} marker type{config.markerTypes.length !== 1 ? 's' : ''} configured
          </p>
        )}
      </div>
    </FieldWrapper>
  )
}
