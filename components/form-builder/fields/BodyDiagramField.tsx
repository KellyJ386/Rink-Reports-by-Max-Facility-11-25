'use client'

import { useState } from 'react'
import type { FormField } from '@/types/form-builder'

interface InjuryMark {
  id: string
  x: number
  y: number
  type: 'bruise' | 'cut' | 'fracture' | 'pain' | 'other'
  notes?: string
}

interface BodyDiagramValue {
  view: 'front' | 'back'
  marks: InjuryMark[]
}

interface BodyDiagramFieldProps {
  field: FormField
  value?: BodyDiagramValue
  onChange?: (value: BodyDiagramValue) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

const INJURY_TYPES = [
  { value: 'bruise', label: 'Bruise', color: 'bg-purple-500', icon: '●' },
  { value: 'cut', label: 'Cut/Laceration', color: 'bg-red-500', icon: '✕' },
  { value: 'fracture', label: 'Fracture/Break', color: 'bg-orange-500', icon: '☆' },
  { value: 'pain', label: 'Pain/Tenderness', color: 'bg-yellow-500', icon: '◆' },
  { value: 'other', label: 'Other', color: 'bg-gray-500', icon: '○' },
]

export default function BodyDiagramField({
  field,
  value = { view: 'front', marks: [] },
  onChange,
  disabled = false,
  error,
  preview = false,
}: BodyDiagramFieldProps) {
  const [selectedType, setSelectedType] = useState<InjuryMark['type']>('pain')
  const [selectedMark, setSelectedMark] = useState<string | null>(null)
  const [markNotes, setMarkNotes] = useState('')

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || preview) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newMark: InjuryMark = {
      id: `mark_${Date.now()}`,
      x,
      y,
      type: selectedType,
    }

    onChange?.({
      ...value,
      marks: [...value.marks, newMark],
    })
    setSelectedMark(newMark.id)
    setMarkNotes('')
  }

  const handleRemoveMark = (markId: string) => {
    onChange?.({
      ...value,
      marks: value.marks.filter((m) => m.id !== markId),
    })
    if (selectedMark === markId) {
      setSelectedMark(null)
    }
  }

  const handleUpdateMarkNotes = () => {
    if (!selectedMark) return
    onChange?.({
      ...value,
      marks: value.marks.map((m) =>
        m.id === selectedMark ? { ...m, notes: markNotes } : m
      ),
    })
  }

  const toggleView = () => {
    onChange?.({
      ...value,
      view: value.view === 'front' ? 'back' : 'front',
    })
  }

  const getMarkStyle = (type: InjuryMark['type']) => {
    return INJURY_TYPES.find((t) => t.value === type)
  }

  const currentMarks = value.marks.filter(() => true) // Could filter by view if needed

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.validation?.some(v => v.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="p-2 bg-gray-50 border-b flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-2">Injury type:</span>
            {INJURY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedType(type.value as InjuryMark['type'])}
                className={`w-8 h-8 rounded flex items-center justify-center text-white transition-all ${type.color} ${
                  selectedType === type.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                }`}
                title={type.label}
                disabled={disabled || preview}
              >
                {type.icon}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleView}
            className="btn btn-secondary text-xs"
            disabled={disabled || preview}
          >
            View: {value.view === 'front' ? 'Front' : 'Back'}
          </button>
        </div>

        {/* Body outline */}
        <div
          className="relative bg-gray-100 cursor-crosshair"
          style={{ paddingBottom: '150%' }}
          onClick={handleDiagramClick}
        >
          {/* Simple body outline SVG */}
          <svg
            viewBox="0 0 100 150"
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            {/* Head */}
            <circle cx="50" cy="12" r="10" fill="none" stroke="#9CA3AF" strokeWidth="1" />

            {/* Neck */}
            <line x1="50" y1="22" x2="50" y2="28" stroke="#9CA3AF" strokeWidth="1" />

            {/* Torso */}
            <path
              d="M30 28 L30 80 L70 80 L70 28 Z"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1"
            />

            {/* Arms */}
            <path
              d="M30 32 L15 55 L12 75"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1"
            />
            <path
              d="M70 32 L85 55 L88 75"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1"
            />

            {/* Legs */}
            <path
              d="M35 80 L32 130 L30 145"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1"
            />
            <path
              d="M65 80 L68 130 L70 145"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1"
            />

            {/* View indicator */}
            <text x="50" y="148" textAnchor="middle" fontSize="4" fill="#9CA3AF">
              {value.view.toUpperCase()}
            </text>
          </svg>

          {/* Injury marks */}
          {currentMarks.map((mark) => {
            const style = getMarkStyle(mark.type)
            return (
              <div
                key={mark.id}
                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer ${style?.color} ${
                  selectedMark === mark.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMark(mark.id)
                  setMarkNotes(mark.notes || '')
                }}
                title={mark.notes || style?.label}
              >
                {style?.icon}
              </div>
            )
          })}
        </div>

        {/* Mark details panel */}
        {selectedMark && (
          <div className="p-3 bg-blue-50 border-t">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  Notes for selected mark:
                </label>
                <textarea
                  value={markNotes}
                  onChange={(e) => setMarkNotes(e.target.value)}
                  onBlur={handleUpdateMarkNotes}
                  className="input w-full text-sm"
                  rows={2}
                  placeholder="Describe the injury..."
                  disabled={disabled || preview}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveMark(selectedMark)}
                className="btn btn-danger text-xs"
                disabled={disabled || preview}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-2 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{currentMarks.length} injury mark{currentMarks.length !== 1 ? 's' : ''} recorded</span>
            {!disabled && !preview && (
              <span>Click on the body to add marks</span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="px-3 pb-2 bg-gray-50 flex flex-wrap gap-3 text-xs">
          {INJURY_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-1">
              <span className={`w-3 h-3 ${type.color} rounded-full flex items-center justify-center text-white text-[8px]`}>
                {type.icon}
              </span>
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
