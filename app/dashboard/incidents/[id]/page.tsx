'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const BODY_PARTS_LABELS: Record<string, string> = {
  head: 'Head',
  face: 'Face',
  neck: 'Neck',
  left_shoulder: 'Left Shoulder',
  right_shoulder: 'Right Shoulder',
  chest: 'Chest',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  abdomen: 'Abdomen',
  left_hand: 'Left Hand',
  right_hand: 'Right Hand',
  groin: 'Groin/Hip',
  left_thigh: 'Left Thigh',
  right_thigh: 'Right Thigh',
  left_knee: 'Left Knee',
  right_knee: 'Right Knee',
  left_shin: 'Left Shin',
  right_shin: 'Right Shin',
  left_foot: 'Left Foot',
  right_foot: 'Right Foot',
  back_head: 'Back of Head',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  left_elbow: 'Left Elbow',
  right_elbow: 'Right Elbow',
  buttocks: 'Buttocks',
  left_hamstring: 'Left Hamstring',
  right_hamstring: 'Right Hamstring',
  left_calf: 'Left Calf',
  right_calf: 'Right Calf',
  left_ankle: 'Left Ankle',
  right_ankle: 'Right Ankle',
}

const INCIDENT_TYPES = [
  { value: 'injury', label: 'Injury' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'near_miss', label: 'Near Miss' },
  { value: 'safety_hazard', label: 'Safety Hazard' },
  { value: 'equipment_failure', label: 'Equipment Failure' },
  { value: 'altercation', label: 'Altercation' },
  { value: 'medical_emergency', label: 'Medical Emergency' },
  { value: 'other', label: 'Other' },
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'critical', label: 'Critical' },
]

const PERSON_TYPES = [
  { value: 'patron', label: 'Patron' },
  { value: 'staff', label: 'Staff' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'visitor', label: 'Visitor' },
]

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical', color: 'bg-red-600 text-white' }
    case 'major':
      return { label: 'Major', color: 'bg-orange-500 text-white' }
    case 'minor':
      return { label: 'Minor', color: 'bg-yellow-500 text-white' }
    default:
      return { label: 'Low', color: 'bg-blue-500 text-white' }
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'injury':
      return { label: 'Injury', color: 'bg-red-100 text-red-800' }
    case 'property_damage':
      return { label: 'Property Damage', color: 'bg-orange-100 text-orange-800' }
    case 'near_miss':
      return { label: 'Near Miss', color: 'bg-yellow-100 text-yellow-800' }
    case 'safety_hazard':
      return { label: 'Safety Hazard', color: 'bg-purple-100 text-purple-800' }
    case 'equipment_failure':
      return { label: 'Equipment Failure', color: 'bg-indigo-100 text-indigo-800' }
    case 'altercation':
      return { label: 'Altercation', color: 'bg-pink-100 text-pink-800' }
    case 'medical_emergency':
      return { label: 'Medical Emergency', color: 'bg-red-100 text-red-800' }
    default:
      return { label: 'Other', color: 'bg-gray-100 text-gray-800' }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return { label: 'Open', color: 'bg-blue-100 text-blue-800' }
    case 'PENDING_REVIEW':
      return { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' }
    case 'APPROVED':
      return { label: 'Resolved', color: 'bg-green-100 text-green-800' }
    case 'REJECTED':
      return { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
    default:
      return { label: 'Draft', color: 'bg-gray-100 text-gray-800' }
  }
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [canEdit, setCanEdit] = useState(false)

  // Edit form state
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    fetchSubmission()
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load')
      }

      setSubmission(data.submission)
      setEditData(data.submission.data || {})

      // Check if user can edit
      const meResponse = await fetch('/api/auth/me')
      if (meResponse.ok) {
        const meData = await meResponse.json()
        const isOwner = data.submission.submittedById === meData.user?.id
        const hasEditPerm = meData.user?.role?.permissions?.incidents?.edit
        setCanEdit(isOwner || hasEditPerm)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: editData }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to save')
      }

      setSubmission({ ...submission, data: editData })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(submission.data || {})
    setIsEditing(false)
    setError('')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this incident report? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to delete')
      }

      router.push('/dashboard/incidents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const toggleBodyPart = (part: string) => {
    const current = editData.injuryLocations || []
    if (current.includes(part)) {
      setEditData({ ...editData, injuryLocations: current.filter((p: string) => p !== part) })
    } else {
      setEditData({ ...editData, injuryLocations: [...current, part] })
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (error && !submission) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/dashboard/incidents" className="btn btn-secondary">Back</Link>
      </div>
    )
  }

  const data = isEditing ? editData : (submission?.data as any)
  const typeBadge = getTypeBadge(data?.incidentType || '')
  const severityBadge = getSeverityBadge(data?.severity || '')
  const statusBadge = getStatusBadge(submission?.status)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/incidents" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Incident Report</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeBadge.color}`}>
              {typeBadge.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityBadge.color}`}>
              {severityBadge.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Reported on {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
        {canEdit && !isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
              Edit
            </button>
            <button onClick={handleDelete} className="btn btn-secondary text-red-600 hover:bg-red-50">
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {isEditing ? (
        // Edit Mode
        <div className="space-y-6">
          {/* Incident Type & Severity */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Classification</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
                <select
                  value={editData.incidentType || ''}
                  onChange={(e) => setEditData({ ...editData, incidentType: e.target.value })}
                  className="input"
                >
                  <option value="">Select type...</option>
                  {INCIDENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={editData.severity || ''}
                  onChange={(e) => setEditData({ ...editData, severity: e.target.value })}
                  className="input"
                >
                  <option value="">Select severity...</option>
                  {SEVERITY_LEVELS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* When & Where */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">When & Where</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editData.incidentDate || ''}
                  onChange={(e) => setEditData({ ...editData, incidentDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={editData.incidentTime || ''}
                  onChange={(e) => setEditData({ ...editData, incidentTime: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Location</label>
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="input"
                  placeholder="e.g., Near east goal, Locker room"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                <input
                  type="text"
                  value={editData.conditions || ''}
                  onChange={(e) => setEditData({ ...editData, conditions: e.target.value })}
                  className="input"
                  placeholder="e.g., Wet ice, Poor lighting"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="input"
              rows={4}
              placeholder="Describe what happened..."
            />
          </div>

          {/* Person Involved */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Person Involved</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editData.involvedPersonName || ''}
                  onChange={(e) => setEditData({ ...editData, involvedPersonName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editData.involvedPersonType || ''}
                  onChange={(e) => setEditData({ ...editData, involvedPersonType: e.target.value })}
                  className="input"
                >
                  <option value="">Select...</option>
                  {PERSON_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editData.involvedPersonPhone || ''}
                  onChange={(e) => setEditData({ ...editData, involvedPersonPhone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.involvedPersonEmail || ''}
                  onChange={(e) => setEditData({ ...editData, involvedPersonEmail: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Injury Details (if injury type) */}
          {(editData.incidentType === 'injury' || editData.incidentType === 'medical_emergency') && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Injury Details</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Affected Body Parts</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(BODY_PARTS_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleBodyPart(key)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        (editData.injuryLocations || []).includes(key)
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Injury Description</label>
                <textarea
                  value={editData.injuryDescription || ''}
                  onChange={(e) => setEditData({ ...editData, injuryDescription: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Describe the injury..."
                />
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.ambulanceCalled || false}
                  onChange={(e) => setEditData({ ...editData, ambulanceCalled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Ambulance was called</span>
              </label>
              {editData.ambulanceCalled && (
                <input
                  type="text"
                  value={editData.ambulanceDetails || ''}
                  onChange={(e) => setEditData({ ...editData, ambulanceDetails: e.target.value })}
                  className="input ml-6"
                  placeholder="Ambulance details..."
                />
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.policeNotified || false}
                  onChange={(e) => setEditData({ ...editData, policeNotified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Police/Security notified</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.parentGuardianNotified || false}
                  onChange={(e) => setEditData({ ...editData, parentGuardianNotified: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Parent/Guardian notified</span>
              </label>
            </div>
          </div>

          {/* Witnesses & Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Witnesses</label>
                <textarea
                  value={editData.witnesses || ''}
                  onChange={(e) => setEditData({ ...editData, witnesses: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Names and contact info of witnesses..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actions Taken</label>
                <textarea
                  value={editData.actionsTaken || ''}
                  onChange={(e) => setEditData({ ...editData, actionsTaken: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="What actions were taken..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Any other relevant information..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button onClick={handleCancel} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          {/* Alert for ambulance */}
          {data?.ambulanceCalled && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">AMBULANCE</span>
                <div>
                  <h3 className="font-semibold text-red-800">Ambulance Was Called</h3>
                  {data?.ambulanceDetails && (
                    <p className="text-red-700 text-sm">{data.ambulanceDetails}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Incident Details */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Date & Time</dt>
                    <dd className="font-medium">
                      {data?.incidentDate || new Date(submission.submittedAt).toLocaleDateString()}
                      {data?.incidentTime && ` at ${data.incidentTime}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Location</dt>
                    <dd className="font-medium">
                      {submission.rink?.name}
                      {data?.location && ` - ${data.location}`}
                    </dd>
                  </div>
                  {data?.equipmentInvolved && (
                    <div>
                      <dt className="text-sm text-gray-500">Equipment Involved</dt>
                      <dd className="font-medium">{data.equipmentInvolved}</dd>
                    </div>
                  )}
                  {data?.conditions && (
                    <div>
                      <dt className="text-sm text-gray-500">Conditions</dt>
                      <dd className="font-medium">{data.conditions}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Description */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{data?.description || 'No description provided'}</p>
              </div>

              {/* Injury Details */}
              {(data?.incidentType === 'injury' || data?.incidentType === 'medical_emergency') && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Injury Details</h2>

                  {data?.injuryLocations && data.injuryLocations.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Affected Body Parts</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.injuryLocations.map((part: string) => (
                          <span
                            key={part}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                          >
                            {BODY_PARTS_LABELS[part] || part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data?.injuryDescription && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Injury Description</h3>
                      <p className="text-gray-700">{data.injuryDescription}</p>
                    </div>
                  )}

                  {!data?.injuryLocations?.length && !data?.injuryDescription && (
                    <p className="text-gray-400">No injury details provided</p>
                  )}
                </div>
              )}

              {/* Witnesses */}
              {data?.witnesses && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Witnesses</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{data.witnesses}</p>
                </div>
              )}

              {/* Actions Taken */}
              {data?.actionsTaken && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Taken</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{data.actionsTaken}</p>
                </div>
              )}

              {/* Additional Notes */}
              {data?.notes && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Person Involved */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Person Involved</h2>
                {data?.involvedPersonName ? (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Name</dt>
                      <dd className="font-medium">{data.involvedPersonName}</dd>
                    </div>
                    {data?.involvedPersonType && (
                      <div>
                        <dt className="text-sm text-gray-500">Role</dt>
                        <dd className="font-medium capitalize">{data.involvedPersonType.replace('_', ' ')}</dd>
                      </div>
                    )}
                    {data?.involvedPersonPhone && (
                      <div>
                        <dt className="text-sm text-gray-500">Phone</dt>
                        <dd className="font-medium">
                          <a href={`tel:${data.involvedPersonPhone}`} className="text-blue-600 hover:underline">
                            {data.involvedPersonPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {data?.involvedPersonEmail && (
                      <div>
                        <dt className="text-sm text-gray-500">Email</dt>
                        <dd className="font-medium">
                          <a href={`mailto:${data.involvedPersonEmail}`} className="text-blue-600 hover:underline">
                            {data.involvedPersonEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-gray-400">No person information recorded</p>
                )}
              </div>

              {/* Notifications */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${data?.ambulanceCalled ? 'text-red-600' : 'text-gray-400'}`}>
                    {data?.ambulanceCalled ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm">Ambulance Called</span>
                  </div>
                  <div className={`flex items-center gap-2 ${data?.policeNotified ? 'text-blue-600' : 'text-gray-400'}`}>
                    {data?.policeNotified ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm">Police/Security Notified</span>
                  </div>
                  <div className={`flex items-center gap-2 ${data?.parentGuardianNotified ? 'text-green-600' : 'text-gray-400'}`}>
                    {data?.parentGuardianNotified ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm">Parent/Guardian Notified</span>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Reported By</dt>
                    <dd className="font-medium">
                      {submission.submittedBy?.firstName} {submission.submittedBy?.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Report ID</dt>
                    <dd className="font-mono text-sm text-gray-600">{submission.id.slice(0, 8)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Submitted</dt>
                    <dd className="text-sm text-gray-600">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
