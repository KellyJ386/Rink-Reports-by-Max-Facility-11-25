'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const OPERATION_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  ice_make: { label: 'Ice Make', icon: '🧊', color: 'bg-blue-100 text-blue-800' },
  circle_check: { label: 'Circle Check', icon: '🔄', color: 'bg-green-100 text-green-800' },
  edging: { label: 'Edging', icon: '📐', color: 'bg-purple-100 text-purple-800' },
  blade_change: { label: 'Blade Change', icon: '🔪', color: 'bg-orange-100 text-orange-800' },
  resurfacing: { label: 'Resurfacing', icon: '🚜', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-800' },
}

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'needs_attention', label: 'Needs Attention' },
  { value: 'replace', label: 'Replace Soon' },
]

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  good: { label: 'Good', color: 'bg-green-100 text-green-800' },
  fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  needs_attention: { label: 'Needs Attention', color: 'bg-orange-100 text-orange-800' },
  replace: { label: 'Replace Soon', color: 'bg-red-100 text-red-800' },
}

export default function IceOperationDetailPage() {
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
  const [editOutsideTemp, setEditOutsideTemp] = useState<string>('')

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
      setEditOutsideTemp(data.submission.outsideTemp?.toString() || '')

      // Check if user can edit (either their own submission or has edit permission)
      const meResponse = await fetch('/api/auth/me')
      if (meResponse.ok) {
        const meData = await meResponse.json()
        const isOwner = data.submission.submittedById === meData.user?.id
        const hasEditPerm = meData.user?.role?.permissions?.iceOperations?.edit
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
        body: JSON.stringify({
          data: editData,
          outsideTemp: editOutsideTemp ? parseFloat(editOutsideTemp) : null,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to save')
      }

      const result = await response.json()
      setSubmission({ ...submission, data: editData, outsideTemp: editOutsideTemp ? parseFloat(editOutsideTemp) : null })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(submission.data || {})
    setEditOutsideTemp(submission.outsideTemp?.toString() || '')
    setIsEditing(false)
    setError('')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
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

      router.push('/dashboard/ice-operations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (error && !submission) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/dashboard/ice-operations" className="btn btn-secondary">Back</Link>
      </div>
    )
  }

  const data = isEditing ? editData : (submission?.data as any)
  const opType = OPERATION_TYPES[data?.operationType] || OPERATION_TYPES.other

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/ice-operations" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-lg ${opType.color}`}>{opType.icon}</span>
            <h1 className="text-2xl font-bold text-gray-900">{opType.label}</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {new Date(submission.submittedAt).toLocaleString()}
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
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Operation</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
                <select
                  value={editData.operationType || ''}
                  onChange={(e) => setEditData({ ...editData, operationType: e.target.value })}
                  className="input"
                >
                  {Object.entries(OPERATION_TYPES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outside Temp (°F)</label>
                  <input
                    type="number"
                    value={editOutsideTemp}
                    onChange={(e) => setEditOutsideTemp(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Water Temp (°F)</label>
                  <input
                    type="number"
                    value={editData.waterTemp || ''}
                    onChange={(e) => setEditData({ ...editData, waterTemp: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ice Temp (°F)</label>
                  <input
                    type="number"
                    value={editData.iceTemp || ''}
                    onChange={(e) => setEditData({ ...editData, iceTemp: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resurfacer Hours</label>
                <input
                  type="number"
                  value={editData.resurfacerHours || ''}
                  onChange={(e) => setEditData({ ...editData, resurfacerHours: e.target.value ? parseFloat(e.target.value) : null })}
                  className="input"
                  step="0.1"
                />
              </div>

              {editData.operationType === 'circle_check' && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-medium text-gray-900">Circle Check Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blade Condition</label>
                      <select
                        value={editData.circleCheck?.bladeCondition || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          circleCheck: { ...editData.circleCheck, bladeCondition: e.target.value }
                        })}
                        className="input"
                      >
                        <option value="">Select...</option>
                        {CONDITION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cloth Condition</label>
                      <select
                        value={editData.circleCheck?.clothCondition || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          circleCheck: { ...editData.circleCheck, clothCondition: e.target.value }
                        })}
                        className="input"
                      >
                        <option value="">Select...</option>
                        {CONDITION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.circleCheck?.waterLevel || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          circleCheck: { ...editData.circleCheck, waterLevel: e.target.checked }
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Water Level OK</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.circleCheck?.lightsWorking || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          circleCheck: { ...editData.circleCheck, lightsWorking: e.target.checked }
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Lights Working</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.circleCheck?.emergencyStop || false}
                        onChange={(e) => setEditData({
                          ...editData,
                          circleCheck: { ...editData.circleCheck, emergencyStop: e.target.checked }
                        })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Emergency Stop Tested</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
            </div>
          </div>

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
        <div className="space-y-6">
          <div className="card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Rink</div>
                <div className="font-medium">{submission.rink.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Submitted By</div>
                <div className="font-medium">{submission.submittedBy.firstName} {submission.submittedBy.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Outside Temp</div>
                <div className="font-medium">{submission.outsideTemp !== null ? `${submission.outsideTemp}°F` : '--'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Time</div>
                <div className="font-medium">{new Date(submission.submittedAt).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

          {(data.resurfacerHours || data.waterTemp || data.iceTemp) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operation Data</h2>
              <div className="grid grid-cols-3 gap-4">
                {data.resurfacerHours && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{data.resurfacerHours}</div>
                    <div className="text-sm text-gray-500">Resurfacer Hours</div>
                  </div>
                )}
                {data.waterTemp && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{data.waterTemp}°F</div>
                    <div className="text-sm text-gray-500">Water Temp</div>
                  </div>
                )}
                {data.iceTemp && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{data.iceTemp}°F</div>
                    <div className="text-sm text-gray-500">Ice Temp</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.circleCheck && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Circle Check Results</h2>
              <div className="space-y-3">
                {data.circleCheck.bladeCondition && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Blade Condition</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${CONDITION_LABELS[data.circleCheck.bladeCondition]?.color || 'bg-gray-100'}`}>
                      {CONDITION_LABELS[data.circleCheck.bladeCondition]?.label || data.circleCheck.bladeCondition}
                    </span>
                  </div>
                )}
                {data.circleCheck.clothCondition && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Cloth Condition</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${CONDITION_LABELS[data.circleCheck.clothCondition]?.color || 'bg-gray-100'}`}>
                      {CONDITION_LABELS[data.circleCheck.clothCondition]?.label || data.circleCheck.clothCondition}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Water Level OK</span>
                  <span className={data.circleCheck.waterLevel ? 'text-green-600' : 'text-red-600'}>
                    {data.circleCheck.waterLevel ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Lights Working</span>
                  <span className={data.circleCheck.lightsWorking ? 'text-green-600' : 'text-red-600'}>
                    {data.circleCheck.lightsWorking ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Emergency Stop Tested</span>
                  <span className={data.circleCheck.emergencyStop ? 'text-green-600' : 'text-red-600'}>
                    {data.circleCheck.emergencyStop ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {data.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
