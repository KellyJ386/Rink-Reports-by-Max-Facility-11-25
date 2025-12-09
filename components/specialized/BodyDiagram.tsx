'use client'

import { useState } from 'react'

export interface InjuryMarker {
  id: string
  x: number // Percentage 0-100
  y: number // Percentage 0-100
  bodyPart: string
  description: string
  severity: 'minor' | 'moderate' | 'severe'
}

interface BodyDiagramProps {
  injuries: InjuryMarker[]
  onChange: (injuries: InjuryMarker[]) => void
  readOnly?: boolean
  view: 'front' | 'back'
  onViewChange: (view: 'front' | 'back') => void
}

// Body part regions for automatic labeling
const bodyRegions = {
  front: [
    { id: 'head', label: 'Head', x: 50, y: 5, width: 15, height: 10 },
    { id: 'face', label: 'Face', x: 50, y: 8, width: 10, height: 5 },
    { id: 'neck', label: 'Neck', x: 50, y: 14, width: 8, height: 4 },
    { id: 'left_shoulder', label: 'Left Shoulder', x: 30, y: 18, width: 12, height: 6 },
    { id: 'right_shoulder', label: 'Right Shoulder', x: 70, y: 18, width: 12, height: 6 },
    { id: 'chest', label: 'Chest', x: 50, y: 25, width: 25, height: 12 },
    { id: 'left_arm', label: 'Left Arm', x: 22, y: 30, width: 8, height: 20 },
    { id: 'right_arm', label: 'Right Arm', x: 78, y: 30, width: 8, height: 20 },
    { id: 'abdomen', label: 'Abdomen', x: 50, y: 40, width: 20, height: 10 },
    { id: 'left_hand', label: 'Left Hand', x: 18, y: 52, width: 8, height: 8 },
    { id: 'right_hand', label: 'Right Hand', x: 82, y: 52, width: 8, height: 8 },
    { id: 'groin', label: 'Groin/Hip', x: 50, y: 52, width: 18, height: 8 },
    { id: 'left_thigh', label: 'Left Thigh', x: 40, y: 60, width: 10, height: 15 },
    { id: 'right_thigh', label: 'Right Thigh', x: 60, y: 60, width: 10, height: 15 },
    { id: 'left_knee', label: 'Left Knee', x: 40, y: 75, width: 8, height: 6 },
    { id: 'right_knee', label: 'Right Knee', x: 60, y: 75, width: 8, height: 6 },
    { id: 'left_shin', label: 'Left Shin', x: 40, y: 82, width: 8, height: 10 },
    { id: 'right_shin', label: 'Right Shin', x: 60, y: 82, width: 8, height: 10 },
    { id: 'left_foot', label: 'Left Foot', x: 40, y: 94, width: 8, height: 6 },
    { id: 'right_foot', label: 'Right Foot', x: 60, y: 94, width: 8, height: 6 },
  ],
  back: [
    { id: 'head_back', label: 'Head (back)', x: 50, y: 5, width: 15, height: 10 },
    { id: 'neck_back', label: 'Neck (back)', x: 50, y: 14, width: 8, height: 4 },
    { id: 'upper_back', label: 'Upper Back', x: 50, y: 22, width: 25, height: 12 },
    { id: 'left_shoulder_back', label: 'Left Shoulder', x: 30, y: 18, width: 12, height: 6 },
    { id: 'right_shoulder_back', label: 'Right Shoulder', x: 70, y: 18, width: 12, height: 6 },
    { id: 'left_arm_back', label: 'Left Arm', x: 22, y: 30, width: 8, height: 20 },
    { id: 'right_arm_back', label: 'Right Arm', x: 78, y: 30, width: 8, height: 20 },
    { id: 'lower_back', label: 'Lower Back', x: 50, y: 38, width: 22, height: 12 },
    { id: 'left_elbow', label: 'Left Elbow', x: 20, y: 38, width: 6, height: 6 },
    { id: 'right_elbow', label: 'Right Elbow', x: 80, y: 38, width: 6, height: 6 },
    { id: 'buttocks', label: 'Buttocks', x: 50, y: 52, width: 20, height: 10 },
    { id: 'left_hamstring', label: 'Left Hamstring', x: 40, y: 62, width: 10, height: 12 },
    { id: 'right_hamstring', label: 'Right Hamstring', x: 60, y: 62, width: 10, height: 12 },
    { id: 'left_calf', label: 'Left Calf', x: 40, y: 78, width: 8, height: 12 },
    { id: 'right_calf', label: 'Right Calf', x: 60, y: 78, width: 8, height: 12 },
    { id: 'left_heel', label: 'Left Heel', x: 40, y: 94, width: 6, height: 5 },
    { id: 'right_heel', label: 'Right Heel', x: 60, y: 94, width: 6, height: 5 },
  ],
}

export default function BodyDiagram({
  injuries,
  onChange,
  readOnly = false,
  view,
  onViewChange,
}: BodyDiagramProps) {
  const [editingInjury, setEditingInjury] = useState<InjuryMarker | null>(null)
  const [tempDescription, setTempDescription] = useState('')
  const [tempSeverity, setTempSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor')

  // Get body part from click position
  const getBodyPartFromPosition = (x: number, y: number): string => {
    const regions = bodyRegions[view]
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
    return 'Unknown'
  }

  // Handle click on body diagram
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const bodyPart = getBodyPartFromPosition(x, y)

    const newInjury: InjuryMarker = {
      id: `injury-${Date.now()}`,
      x,
      y,
      bodyPart,
      description: '',
      severity: 'minor',
    }

    setEditingInjury(newInjury)
    setTempDescription('')
    setTempSeverity('minor')
  }

  // Handle save injury
  const handleSaveInjury = () => {
    if (!editingInjury) return

    const updatedInjury = {
      ...editingInjury,
      description: tempDescription,
      severity: tempSeverity,
    }

    const existingIndex = injuries.findIndex(i => i.id === editingInjury.id)
    if (existingIndex >= 0) {
      const newInjuries = [...injuries]
      newInjuries[existingIndex] = updatedInjury
      onChange(newInjuries)
    } else {
      onChange([...injuries, updatedInjury])
    }

    setEditingInjury(null)
  }

  // Handle delete injury
  const handleDeleteInjury = (injuryId: string) => {
    onChange(injuries.filter(i => i.id !== injuryId))
  }

  // Handle edit existing injury
  const handleEditInjury = (injury: InjuryMarker) => {
    if (readOnly) return
    setEditingInjury(injury)
    setTempDescription(injury.description)
    setTempSeverity(injury.severity)
  }

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'severe': return 'bg-red-500 border-red-700'
      case 'moderate': return 'bg-orange-500 border-orange-700'
      default: return 'bg-yellow-500 border-yellow-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onViewChange('front')}
          className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
            view === 'front'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Front View
        </button>
        <button
          type="button"
          onClick={() => onViewChange('back')}
          className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
            view === 'back'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Back View
        </button>
      </div>

      {/* Instructions */}
      {!readOnly && (
        <p className="text-sm text-center text-gray-500">
          Click on the body to mark injury locations
        </p>
      )}

      {/* Body Diagram */}
      <div className="flex justify-center">
        <div
          className="relative bg-gray-100 rounded-lg cursor-crosshair"
          style={{ width: '300px', height: '500px' }}
          onClick={handleClick}
        >
          {/* Body Outline SVG */}
          <svg
            viewBox="0 0 100 160"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {view === 'front' ? (
              // Front view body outline
              <g fill="none" stroke="#9ca3af" strokeWidth="0.5">
                {/* Head */}
                <ellipse cx="50" cy="12" rx="10" ry="12" />
                {/* Neck */}
                <line x1="45" y1="24" x2="45" y2="28" />
                <line x1="55" y1="24" x2="55" y2="28" />
                {/* Torso */}
                <path d="M 30 28 Q 25 35 25 55 L 25 80 Q 25 85 35 85 L 35 85 L 40 85" />
                <path d="M 70 28 Q 75 35 75 55 L 75 80 Q 75 85 65 85 L 65 85 L 60 85" />
                <line x1="30" y1="28" x2="70" y2="28" />
                {/* Arms */}
                <path d="M 30 28 Q 20 30 18 50 Q 16 65 15 80" />
                <path d="M 70 28 Q 80 30 82 50 Q 84 65 85 80" />
                {/* Hands */}
                <ellipse cx="14" cy="85" rx="5" ry="7" />
                <ellipse cx="86" cy="85" rx="5" ry="7" />
                {/* Legs */}
                <path d="M 40 85 L 38 120 L 36 145 L 38 155" />
                <path d="M 60 85 L 62 120 L 64 145 L 62 155" />
                <path d="M 45 85 L 43 120 L 41 145 L 43 155" />
                <path d="M 55 85 L 57 120 L 59 145 L 57 155" />
                {/* Feet */}
                <ellipse cx="40" cy="157" rx="6" ry="3" />
                <ellipse cx="60" cy="157" rx="6" ry="3" />
              </g>
            ) : (
              // Back view body outline
              <g fill="none" stroke="#9ca3af" strokeWidth="0.5">
                {/* Head */}
                <ellipse cx="50" cy="12" rx="10" ry="12" />
                {/* Neck */}
                <line x1="45" y1="24" x2="45" y2="28" />
                <line x1="55" y1="24" x2="55" y2="28" />
                {/* Torso */}
                <path d="M 30 28 Q 25 35 25 55 L 25 80 Q 25 85 35 85 L 35 85 L 40 85" />
                <path d="M 70 28 Q 75 35 75 55 L 75 80 Q 75 85 65 85 L 65 85 L 60 85" />
                <line x1="30" y1="28" x2="70" y2="28" />
                {/* Spine line */}
                <line x1="50" y1="28" x2="50" y2="85" strokeDasharray="2" />
                {/* Arms */}
                <path d="M 30 28 Q 20 30 18 50 Q 16 65 15 80" />
                <path d="M 70 28 Q 80 30 82 50 Q 84 65 85 80" />
                {/* Hands */}
                <ellipse cx="14" cy="85" rx="5" ry="7" />
                <ellipse cx="86" cy="85" rx="5" ry="7" />
                {/* Legs */}
                <path d="M 40 85 L 38 120 L 36 145 L 38 155" />
                <path d="M 60 85 L 62 120 L 64 145 L 62 155" />
                <path d="M 45 85 L 43 120 L 41 145 L 43 155" />
                <path d="M 55 85 L 57 120 L 59 145 L 57 155" />
                {/* Heels */}
                <ellipse cx="40" cy="157" rx="5" ry="3" />
                <ellipse cx="60" cy="157" rx="5" ry="3" />
              </g>
            )}
          </svg>

          {/* Injury Markers */}
          {injuries.map((injury) => (
            <div
              key={injury.id}
              className={`absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer border-2 flex items-center justify-center text-white text-xs font-bold shadow-lg hover:scale-110 transition-transform ${getSeverityColor(injury.severity)}`}
              style={{
                left: `${injury.x}%`,
                top: `${injury.y}%`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleEditInjury(injury)
              }}
              title={`${injury.bodyPart}: ${injury.description || 'No description'}`}
            >
              !
            </div>
          ))}
        </div>
      </div>

      {/* Injury Edit Modal */}
      {editingInjury && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {injuries.find(i => i.id === editingInjury.id) ? 'Edit' : 'Add'} Injury
            </h3>

            <div className="space-y-4">
              {/* Body Part */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Part
                </label>
                <input
                  type="text"
                  value={editingInjury.bodyPart}
                  readOnly
                  className="input bg-gray-50"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <div className="flex gap-2">
                  {(['minor', 'moderate', 'severe'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setTempSeverity(sev)}
                      className={`flex-1 py-2 px-3 rounded-md capitalize font-medium transition-colors ${
                        tempSeverity === sev
                          ? sev === 'severe'
                            ? 'bg-red-500 text-white'
                            : sev === 'moderate'
                            ? 'bg-orange-500 text-white'
                            : 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  placeholder="Describe the injury..."
                  rows={3}
                  className="input"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              <div>
                {injuries.find(i => i.id === editingInjury.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteInjury(editingInjury.id)
                      setEditingInjury(null)
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInjury(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInjury}
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span>Minor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Severe</span>
        </div>
      </div>

      {/* Injury List */}
      {injuries.length > 0 && (
        <div className="border rounded-lg divide-y">
          <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-700">
            Marked Injuries ({injuries.length})
          </div>
          {injuries.map((injury) => (
            <div
              key={injury.id}
              className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => handleEditInjury(injury)}
            >
              <div>
                <div className="font-medium text-gray-900">{injury.bodyPart}</div>
                <div className="text-sm text-gray-500">
                  {injury.description || 'No description'}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                  injury.severity === 'severe'
                    ? 'bg-red-100 text-red-700'
                    : injury.severity === 'moderate'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {injury.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
