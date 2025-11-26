'use client'

import { useState, useEffect, useRef } from 'react'
import { UseFormSetValue, FieldValues } from 'react-hook-form'
import type { BodyDiagramFieldSchema } from '@/types/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BodyDiagramFieldProps {
  field: BodyDiagramFieldSchema
  setValue: UseFormSetValue<FieldValues>
  defaultValue?: InjuryMark[]
  disabled?: boolean
}

export interface InjuryMark {
  id: string
  view: 'front' | 'back' | 'head'
  x: number // Percentage 0-100
  y: number // Percentage 0-100
  type: string
  description: string
  severity?: 'minor' | 'moderate' | 'severe'
}

const INJURY_TYPES = [
  'Bruise',
  'Cut/Laceration',
  'Burn',
  'Fracture',
  'Sprain/Strain',
  'Swelling',
  'Pain',
  'Other',
]

const SEVERITY_COLORS = {
  minor: 'bg-yellow-400 border-yellow-600',
  moderate: 'bg-orange-400 border-orange-600',
  severe: 'bg-red-500 border-red-700',
}

export default function BodyDiagramField({
  field,
  setValue,
  defaultValue = [],
  disabled = false,
}: BodyDiagramFieldProps) {
  const [injuries, setInjuries] = useState<InjuryMark[]>(defaultValue)
  const [activeView, setActiveView] = useState<'front' | 'back' | 'head'>('front')
  const [selectedInjury, setSelectedInjury] = useState<string | null>(null)
  const [editingInjury, setEditingInjury] = useState<InjuryMark | null>(null)
  const diagramRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setValue(field.id, injuries)
  }, [injuries, field.id, setValue])

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    const rect = diagramRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Create new injury mark
    const newInjury: InjuryMark = {
      id: `injury-${Date.now()}`,
      view: activeView,
      x,
      y,
      type: 'Bruise',
      description: '',
      severity: 'minor',
    }

    setInjuries([...injuries, newInjury])
    setEditingInjury(newInjury)
  }

  const handleUpdateInjury = (id: string, updates: Partial<InjuryMark>) => {
    setInjuries(
      injuries.map((injury) =>
        injury.id === id ? { ...injury, ...updates } : injury
      )
    )
    if (editingInjury?.id === id) {
      setEditingInjury({ ...editingInjury, ...updates })
    }
  }

  const handleRemoveInjury = (id: string) => {
    setInjuries(injuries.filter((injury) => injury.id !== id))
    if (selectedInjury === id) setSelectedInjury(null)
    if (editingInjury?.id === id) setEditingInjury(null)
  }

  const getInjuriesForView = () => {
    return injuries.filter((injury) => injury.view === activeView)
  }

  const renderBodyDiagram = () => {
    const viewInjuries = getInjuriesForView()

    return (
      <div
        ref={diagramRef}
        className={`relative bg-white border-2 border-wolf-300 rounded-lg ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
        }`}
        onClick={handleDiagramClick}
        style={{ aspectRatio: activeView === 'head' ? '1/1' : '1/2' }}
      >
        {/* SVG Body Outline */}
        <svg
          viewBox={activeView === 'head' ? '0 0 200 200' : '0 0 200 400'}
          className="w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          {activeView === 'front' && (
            <>
              {/* Head */}
              <ellipse cx="100" cy="30" rx="25" ry="30" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Neck */}
              <rect x="90" y="55" width="20" height="15" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Torso */}
              <rect x="60" y="70" width="80" height="120" rx="10" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Left Arm */}
              <rect x="30" y="80" width="25" height="90" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Right Arm */}
              <rect x="145" y="80" width="25" height="90" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Left Leg */}
              <rect x="70" y="195" width="25" height="180" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Right Leg */}
              <rect x="105" y="195" width="25" height="180" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
            </>
          )}

          {activeView === 'back' && (
            <>
              {/* Head */}
              <ellipse cx="100" cy="30" rx="25" ry="30" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Neck */}
              <rect x="90" y="55" width="20" height="15" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Torso */}
              <rect x="60" y="70" width="80" height="120" rx="10" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Spine line */}
              <line x1="100" y1="70" x2="100" y2="190" stroke="#A5ACAF" strokeWidth="1" strokeDasharray="5,5" />
              {/* Left Arm */}
              <rect x="30" y="80" width="25" height="90" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Right Arm */}
              <rect x="145" y="80" width="25" height="90" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Left Leg */}
              <rect x="70" y="195" width="25" height="180" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Right Leg */}
              <rect x="105" y="195" width="25" height="180" rx="5" fill="none" stroke="#A5ACAF" strokeWidth="2" />
            </>
          )}

          {activeView === 'head' && (
            <>
              {/* Head outline */}
              <ellipse cx="100" cy="100" rx="60" ry="75" fill="none" stroke="#A5ACAF" strokeWidth="2" />
              {/* Eyes */}
              <circle cx="75" cy="90" r="8" fill="none" stroke="#A5ACAF" strokeWidth="1" />
              <circle cx="125" cy="90" r="8" fill="none" stroke="#A5ACAF" strokeWidth="1" />
              {/* Nose */}
              <line x1="100" y1="90" x2="100" y2="110" stroke="#A5ACAF" strokeWidth="1" />
              {/* Mouth */}
              <path d="M 80 130 Q 100 140 120 130" fill="none" stroke="#A5ACAF" strokeWidth="1" />
            </>
          )}
        </svg>

        {/* Injury Marks */}
        {viewInjuries.map((injury) => (
          <div
            key={injury.id}
            className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${
              SEVERITY_COLORS[injury.severity || 'minor']
            } ${selectedInjury === injury.id ? 'ring-4 ring-navy-500 scale-125' : ''}`}
            style={{
              left: `${injury.x}%`,
              top: `${injury.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedInjury(injury.id)
              setEditingInjury(injury)
            }}
          >
            <span className="text-white text-xs font-bold">
              {injuries.filter((i) => i.view === activeView).indexOf(injury) + 1}
            </span>
          </div>
        ))}

        {/* Instructions overlay */}
        {viewInjuries.length === 0 && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-navy-50 bg-opacity-90 px-6 py-3 rounded-lg border border-navy-200">
              <p className="text-sm text-navy-700">Click on the diagram to mark an injury</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={activeView === 'front' ? 'default' : 'outline'}
          onClick={() => setActiveView('front')}
          disabled={disabled}
        >
          Front View
        </Button>
        <Button
          type="button"
          variant={activeView === 'back' ? 'default' : 'outline'}
          onClick={() => setActiveView('back')}
          disabled={disabled}
        >
          Back View
        </Button>
        <Button
          type="button"
          variant={activeView === 'head' ? 'default' : 'outline'}
          onClick={() => setActiveView('head')}
          disabled={disabled}
        >
          Head View
        </Button>
      </div>

      {/* Stats */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">Total Injuries</div>
            <div className="text-lg font-bold text-navy-900">{injuries.length}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">Current View</div>
            <div className="text-lg font-bold text-navy-900">
              {getInjuriesForView().length}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-navy-600 uppercase">Severe</div>
            <div className="text-lg font-bold text-red-600">
              {injuries.filter((i) => i.severity === 'severe').length}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full"></div>
          <span>Minor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 border-2 border-orange-600 rounded-full"></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border-2 border-red-700 rounded-full"></div>
          <span>Severe</span>
        </div>
      </div>

      {/* Body Diagram */}
      <div className="max-w-md mx-auto">{renderBodyDiagram()}</div>

      {/* Injury Details Form */}
      {editingInjury && (
        <div className="border-2 border-action-green-500 rounded-lg p-4 bg-action-green-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-navy-900">
              Injury #{injuries.indexOf(editingInjury) + 1} Details
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingInjury(null)}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-3">
            {/* Injury Type */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Injury Type *
              </label>
              <select
                value={editingInjury.type}
                onChange={(e) =>
                  handleUpdateInjury(editingInjury.id, { type: e.target.value })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border border-wolf-300 rounded-lg focus:ring-2 focus:ring-action-green-500 focus:border-action-green-500"
              >
                {INJURY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Severity *
              </label>
              <select
                value={editingInjury.severity || 'minor'}
                onChange={(e) =>
                  handleUpdateInjury(editingInjury.id, {
                    severity: e.target.value as 'minor' | 'moderate' | 'severe',
                  })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border border-wolf-300 rounded-lg focus:ring-2 focus:ring-action-green-500 focus:border-action-green-500"
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Description
              </label>
              <textarea
                value={editingInjury.description}
                onChange={(e) =>
                  handleUpdateInjury(editingInjury.id, { description: e.target.value })
                }
                disabled={disabled}
                placeholder="Describe the injury location and details..."
                rows={3}
                className="w-full px-3 py-2 border border-wolf-300 rounded-lg focus:ring-2 focus:ring-action-green-500 focus:border-action-green-500"
              />
            </div>

            {/* Remove Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRemoveInjury(editingInjury.id)}
              disabled={disabled}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              🗑️ Remove This Injury
            </Button>
          </div>
        </div>
      )}

      {/* Injuries List */}
      {injuries.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-navy-900">All Injuries ({injuries.length})</h4>
          <div className="space-y-2">
            {injuries.map((injury, index) => (
              <div
                key={injury.id}
                className={`flex items-start justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedInjury === injury.id
                    ? 'border-action-green-500 bg-action-green-50'
                    : 'border-wolf-200 hover:border-wolf-400'
                }`}
                onClick={() => {
                  setSelectedInjury(injury.id)
                  setEditingInjury(injury)
                  setActiveView(injury.view)
                }}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      SEVERITY_COLORS[injury.severity || 'minor']
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-navy-900">{injury.type}</div>
                    <div className="text-sm text-wolf-600">
                      {injury.view.charAt(0).toUpperCase() + injury.view.slice(1)} view •{' '}
                      {injury.severity?.charAt(0).toUpperCase() + injury.severity?.slice(1)}
                    </div>
                    {injury.description && (
                      <div className="text-sm text-wolf-700 mt-1">{injury.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help text */}
      {field.helpText && <p className="text-sm text-wolf-500">{field.helpText}</p>}

      {/* Required indicator */}
      {field.required && injuries.length === 0 && (
        <p className="text-sm text-red-500">
          * This field is required. Please mark at least one injury on the diagram.
        </p>
      )}
    </div>
  )
}
