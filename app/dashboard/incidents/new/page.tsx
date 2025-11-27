'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

// Body parts mapping for injury location selection
const BODY_PARTS = {
  front: [
    { id: 'head', label: 'Head', x: 50, y: 8, width: 12, height: 10 },
    { id: 'face', label: 'Face', x: 50, y: 12, width: 8, height: 6 },
    { id: 'neck', label: 'Neck', x: 50, y: 18, width: 6, height: 4 },
    { id: 'left_shoulder', label: 'Left Shoulder', x: 32, y: 24, width: 10, height: 8 },
    { id: 'right_shoulder', label: 'Right Shoulder', x: 68, y: 24, width: 10, height: 8 },
    { id: 'chest', label: 'Chest', x: 50, y: 30, width: 20, height: 12 },
    { id: 'left_arm', label: 'Left Arm', x: 24, y: 35, width: 8, height: 18 },
    { id: 'right_arm', label: 'Right Arm', x: 76, y: 35, width: 8, height: 18 },
    { id: 'abdomen', label: 'Abdomen', x: 50, y: 44, width: 18, height: 10 },
    { id: 'left_hand', label: 'Left Hand', x: 18, y: 55, width: 8, height: 10 },
    { id: 'right_hand', label: 'Right Hand', x: 82, y: 55, width: 8, height: 10 },
    { id: 'groin', label: 'Groin/Hip', x: 50, y: 55, width: 16, height: 8 },
    { id: 'left_thigh', label: 'Left Thigh', x: 40, y: 64, width: 10, height: 14 },
    { id: 'right_thigh', label: 'Right Thigh', x: 60, y: 64, width: 10, height: 14 },
    { id: 'left_knee', label: 'Left Knee', x: 40, y: 78, width: 8, height: 8 },
    { id: 'right_knee', label: 'Right Knee', x: 60, y: 78, width: 8, height: 8 },
    { id: 'left_shin', label: 'Left Shin', x: 40, y: 86, width: 7, height: 10 },
    { id: 'right_shin', label: 'Right Shin', x: 60, y: 86, width: 7, height: 10 },
    { id: 'left_foot', label: 'Left Foot', x: 40, y: 96, width: 8, height: 6 },
    { id: 'right_foot', label: 'Right Foot', x: 60, y: 96, width: 8, height: 6 },
  ],
  back: [
    { id: 'back_head', label: 'Back of Head', x: 50, y: 8, width: 12, height: 10 },
    { id: 'upper_back', label: 'Upper Back', x: 50, y: 26, width: 22, height: 12 },
    { id: 'lower_back', label: 'Lower Back', x: 50, y: 40, width: 20, height: 12 },
    { id: 'left_elbow', label: 'Left Elbow', x: 24, y: 42, width: 6, height: 6 },
    { id: 'right_elbow', label: 'Right Elbow', x: 76, y: 42, width: 6, height: 6 },
    { id: 'buttocks', label: 'Buttocks', x: 50, y: 54, width: 18, height: 10 },
    { id: 'left_hamstring', label: 'Left Hamstring', x: 40, y: 66, width: 10, height: 12 },
    { id: 'right_hamstring', label: 'Right Hamstring', x: 60, y: 66, width: 10, height: 12 },
    { id: 'left_calf', label: 'Left Calf', x: 40, y: 84, width: 7, height: 12 },
    { id: 'right_calf', label: 'Right Calf', x: 60, y: 84, width: 7, height: 12 },
    { id: 'left_ankle', label: 'Left Ankle', x: 40, y: 94, width: 6, height: 5 },
    { id: 'right_ankle', label: 'Right Ankle', x: 60, y: 94, width: 6, height: 5 },
  ],
}

interface BodyDiagramProps {
  selectedParts: string[]
  onSelect: (parts: string[]) => void
}

function BodyDiagram({ selectedParts, onSelect }: BodyDiagramProps) {
  const [view, setView] = useState<'front' | 'back'>('front')

  const togglePart = (partId: string) => {
    if (selectedParts.includes(partId)) {
      onSelect(selectedParts.filter((p) => p !== partId))
    } else {
      onSelect([...selectedParts, partId])
    }
  }

  const parts = BODY_PARTS[view]

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setView('front')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'front'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Front View
        </button>
        <button
          type="button"
          onClick={() => setView('back')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'back'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Back View
        </button>
      </div>

      {/* Body Diagram */}
      <div className="relative bg-gray-50 rounded-lg p-4">
        <svg viewBox="0 0 100 105" className="w-full max-w-xs mx-auto">
          {/* Body outline - Front/Back */}
          {view === 'front' ? (
            <>
              {/* Head */}
              <ellipse cx="50" cy="10" rx="8" ry="9" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Neck */}
              <rect x="46" y="18" width="8" height="6" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Torso */}
              <path d="M34 24 L66 24 L68 30 L70 55 L64 58 L36 58 L30 55 L32 30 Z" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Arm */}
              <path d="M34 24 L28 26 L22 38 L18 55 L24 56 L28 42 L32 30" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Arm */}
              <path d="M66 24 L72 26 L78 38 L82 55 L76 56 L72 42 L68 30" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Hand */}
              <ellipse cx="18" cy="60" rx="5" ry="6" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Hand */}
              <ellipse cx="82" cy="60" rx="5" ry="6" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Leg */}
              <path d="M36 58 L38 78 L36 95 L44 95 L46 78 L44 58" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Leg */}
              <path d="M56 58 L54 78 L56 95 L64 95 L62 78 L64 58" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Foot */}
              <ellipse cx="40" cy="99" rx="5" ry="3" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Foot */}
              <ellipse cx="60" cy="99" rx="5" ry="3" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
            </>
          ) : (
            <>
              {/* Head (back) */}
              <ellipse cx="50" cy="10" rx="8" ry="9" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Neck */}
              <rect x="46" y="18" width="8" height="6" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Torso (back) */}
              <path d="M34 24 L66 24 L68 30 L70 55 L64 58 L36 58 L30 55 L32 30 Z" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Arm */}
              <path d="M34 24 L28 26 L22 38 L18 55 L24 56 L28 42 L32 30" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Arm */}
              <path d="M66 24 L72 26 L78 38 L82 55 L76 56 L72 42 L68 30" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Hand */}
              <ellipse cx="18" cy="60" rx="5" ry="6" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Hand */}
              <ellipse cx="82" cy="60" rx="5" ry="6" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Leg */}
              <path d="M36 58 L38 78 L36 95 L44 95 L46 78 L44 58" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Leg */}
              <path d="M56 58 L54 78 L56 95 L64 95 L62 78 L64 58" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Left Foot */}
              <ellipse cx="40" cy="99" rx="5" ry="3" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
              {/* Right Foot */}
              <ellipse cx="60" cy="99" rx="5" ry="3" fill="#f0e6dc" stroke="#d4c4b0" strokeWidth="0.5" />
            </>
          )}

          {/* Clickable Areas */}
          {parts.map((part) => (
            <g key={part.id} onClick={() => togglePart(part.id)} style={{ cursor: 'pointer' }}>
              <rect
                x={part.x - part.width / 2}
                y={part.y - part.height / 2}
                width={part.width}
                height={part.height}
                fill={selectedParts.includes(part.id) ? 'rgba(239, 68, 68, 0.6)' : 'transparent'}
                stroke={selectedParts.includes(part.id) ? '#dc2626' : 'transparent'}
                strokeWidth="0.5"
                rx="1"
                className="hover:fill-red-200 transition-colors"
              />
              {selectedParts.includes(part.id) && (
                <circle cx={part.x} cy={part.y} r="2" fill="#dc2626" />
              )}
            </g>
          ))}
        </svg>
        <p className="text-center text-sm text-gray-500 mt-2">
          Click on body areas to mark injury locations
        </p>
      </div>

      {/* Selected Parts List */}
      {selectedParts.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-red-800 mb-2">Selected Injury Locations:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedParts.map((partId) => {
              const part =
                BODY_PARTS.front.find((p) => p.id === partId) ||
                BODY_PARTS.back.find((p) => p.id === partId)
              return (
                <span
                  key={partId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                >
                  {part?.label || partId}
                  <button
                    type="button"
                    onClick={() => togglePart(partId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewIncidentPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    rinkId: '',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    incidentType: '',
    severity: '',
    location: '',
    involvedPersonName: '',
    involvedPersonType: '',
    involvedPersonPhone: '',
    involvedPersonEmail: '',
    injuryLocations: [] as string[],
    injuryDescription: '',
    description: '',
    witnesses: '',
    actionsTaken: '',
    ambulanceCalled: false,
    ambulanceDetails: '',
    policeNotified: false,
    parentGuardianNotified: false,
    equipmentInvolved: '',
    conditions: '',
    notes: '',
  })

  useEffect(() => {
    fetchRinks()
  }, [])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/rinks')
      const data = await response.json()
      if (response.ok) {
        setRinks(data.rinks)
        if (data.rinks.length === 1) {
          setFormData((prev) => ({ ...prev, rinkId: data.rinks[0].id }))
        }
      }
    } catch (err) {
      setError('Failed to load rinks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.rinkId) {
      setError('Please select a location')
      return
    }

    if (!formData.incidentType) {
      setError('Please select an incident type')
      return
    }

    if (!formData.severity) {
      setError('Please select a severity level')
      return
    }

    if (!formData.description) {
      setError('Please provide a description of the incident')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: 'incident-default',
          rinkId: formData.rinkId,
          data: {
            incidentDate: formData.incidentDate,
            incidentTime: formData.incidentTime,
            incidentType: formData.incidentType,
            severity: formData.severity,
            location: formData.location,
            involvedPersonName: formData.involvedPersonName,
            involvedPersonType: formData.involvedPersonType,
            involvedPersonPhone: formData.involvedPersonPhone,
            involvedPersonEmail: formData.involvedPersonEmail,
            injuryLocations: formData.injuryLocations,
            injuryDescription: formData.injuryDescription,
            description: formData.description,
            witnesses: formData.witnesses,
            actionsTaken: formData.actionsTaken,
            ambulanceCalled: formData.ambulanceCalled,
            ambulanceDetails: formData.ambulanceDetails,
            policeNotified: formData.policeNotified,
            parentGuardianNotified: formData.parentGuardianNotified,
            equipmentInvolved: formData.equipmentInvolved,
            conditions: formData.conditions,
            notes: formData.notes,
          },
          status: formData.ambulanceCalled ? 'PENDING_REVIEW' : 'SUBMITTED',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/dashboard/incidents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/incidents" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Incident</h1>
          <p className="text-gray-600 text-sm mt-1">Document incidents for safety tracking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.incidentTime}
                onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rink/Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.rinkId}
                onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select location...</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>{rink.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Area
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                placeholder="e.g., Center ice, Penalty box, Lobby"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                className="input"
                required
              >
                <option value="">Select type...</option>
                <option value="injury">Injury</option>
                <option value="property_damage">Property Damage</option>
                <option value="near_miss">Near Miss</option>
                <option value="safety_hazard">Safety Hazard</option>
                <option value="equipment_failure">Equipment Failure</option>
                <option value="altercation">Altercation</option>
                <option value="medical_emergency">Medical Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="input"
                required
              >
                <option value="">Select severity...</option>
                <option value="low">Low - No injury or minor concern</option>
                <option value="minor">Minor - First aid required</option>
                <option value="major">Major - Medical attention needed</option>
                <option value="critical">Critical - Emergency/Life-threatening</option>
              </select>
            </div>
          </div>
        </div>

        {/* Person Involved */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Person Involved</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.involvedPersonName}
                onChange={(e) => setFormData({ ...formData, involvedPersonName: e.target.value })}
                className="input"
                placeholder="Name of person involved"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.involvedPersonType}
                onChange={(e) => setFormData({ ...formData, involvedPersonType: e.target.value })}
                className="input"
              >
                <option value="">Select role...</option>
                <option value="player">Player/Skater</option>
                <option value="spectator">Spectator</option>
                <option value="staff">Staff/Employee</option>
                <option value="coach">Coach</option>
                <option value="referee">Referee/Official</option>
                <option value="visitor">Visitor</option>
                <option value="contractor">Contractor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.involvedPersonPhone}
                onChange={(e) => setFormData({ ...formData, involvedPersonPhone: e.target.value })}
                className="input"
                placeholder="Contact phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.involvedPersonEmail}
                onChange={(e) => setFormData({ ...formData, involvedPersonEmail: e.target.value })}
                className="input"
                placeholder="Contact email"
              />
            </div>
          </div>
        </div>

        {/* Injury Details - Only show for injury type */}
        {(formData.incidentType === 'injury' || formData.incidentType === 'medical_emergency') && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Injury Details</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Injury Location (click on body diagram)
              </label>
              <BodyDiagram
                selectedParts={formData.injuryLocations}
                onSelect={(parts) => setFormData({ ...formData, injuryLocations: parts })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Injury Description
              </label>
              <textarea
                value={formData.injuryDescription}
                onChange={(e) => setFormData({ ...formData, injuryDescription: e.target.value })}
                className="input"
                rows={3}
                placeholder="Describe the nature of the injury (e.g., laceration, bruise, sprain, etc.)"
              />
            </div>
          </div>
        )}

        {/* Incident Description */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What Happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
                placeholder="Provide a detailed description of what occurred..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Witnesses</label>
              <textarea
                value={formData.witnesses}
                onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                className="input"
                rows={2}
                placeholder="Names and contact info of any witnesses"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Involved</label>
                <input
                  type="text"
                  value={formData.equipmentInvolved}
                  onChange={(e) => setFormData({ ...formData, equipmentInvolved: e.target.value })}
                  className="input"
                  placeholder="e.g., Zamboni, skates, boards"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                <input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="input"
                  placeholder="e.g., Wet floor, poor lighting"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Response & Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response & Actions</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
              <textarea
                value={formData.actionsTaken}
                onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                className="input"
                rows={3}
                placeholder="Describe any immediate actions taken in response..."
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ambulanceCalled}
                  onChange={(e) => setFormData({ ...formData, ambulanceCalled: e.target.checked })}
                  className="h-5 w-5 rounded border-red-300 text-red-600"
                />
                <div>
                  <span className="font-medium text-red-800">Ambulance Called</span>
                  <p className="text-sm text-red-600">This will trigger an immediate notification to management</p>
                </div>
              </label>

              {formData.ambulanceCalled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ambulance/Hospital Details
                  </label>
                  <textarea
                    value={formData.ambulanceDetails}
                    onChange={(e) => setFormData({ ...formData, ambulanceDetails: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="EMS unit number, hospital transported to, etc."
                  />
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.policeNotified}
                  onChange={(e) => setFormData({ ...formData, policeNotified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Police/Security Notified</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.parentGuardianNotified}
                  onChange={(e) => setFormData({ ...formData, parentGuardianNotified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Parent/Guardian Notified (if minor)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input"
            rows={3}
            placeholder="Any other relevant information..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/incidents" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}
