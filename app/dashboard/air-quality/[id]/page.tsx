'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AirQualityDetailPage() {
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

  const thresholds = {
    coWarning: 20,
    coEvacuation: 83,
    no2Warning: 0.3,
    no2Evacuation: 2.0,
  }

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
        const hasEditPerm = meData.user?.role?.permissions?.airQuality?.edit
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

      router.push('/dashboard/air-quality')
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
        <Link href="/dashboard/air-quality" className="btn btn-secondary">Back</Link>
      </div>
    )
  }

  const data = isEditing ? editData : (submission?.data as any)
  const coStatus = data?.coPpm >= thresholds.coEvacuation ? 'danger' : data?.coPpm >= thresholds.coWarning ? 'warning' : 'normal'
  const no2Status = data?.no2Ppm >= thresholds.no2Evacuation ? 'danger' : data?.no2Ppm >= thresholds.no2Warning ? 'warning' : 'normal'

  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/air-quality" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Air Quality Reading</h1>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gas Readings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carbon Monoxide (CO) ppm
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.coPpm || ''}
                  onChange={(e) => setEditData({ ...editData, coPpm: e.target.value ? parseFloat(e.target.value) : null })}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Warning: {thresholds.coWarning}ppm | Evacuation: {thresholds.coEvacuation}ppm
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nitrogen Dioxide (NO2) ppm
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.no2Ppm || ''}
                  onChange={(e) => setEditData({ ...editData, no2Ppm: e.target.value ? parseFloat(e.target.value) : null })}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Warning: {thresholds.no2Warning}ppm | Evacuation: {thresholds.no2Evacuation}ppm
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Conditions</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  value={editData.temperature || ''}
                  onChange={(e) => setEditData({ ...editData, temperature: e.target.value ? parseFloat(e.target.value) : null })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                <input
                  type="number"
                  value={editData.humidity || ''}
                  onChange={(e) => setEditData({ ...editData, humidity: e.target.value ? parseFloat(e.target.value) : null })}
                  className="input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.resurfacerRunning || false}
                  onChange={(e) => setEditData({ ...editData, resurfacerRunning: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Resurfacer running during reading</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.doorsOpen || false}
                  onChange={(e) => setEditData({ ...editData, doorsOpen: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Doors/vents open</span>
              </label>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Additional notes..."
            />
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
        <>
          {/* Alert if any */}
          {(coStatus !== 'normal' || no2Status !== 'normal') && (
            <div className={`p-4 mb-6 rounded-lg ${coStatus === 'danger' || no2Status === 'danger' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-yellow-100 border-l-4 border-yellow-500'}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{coStatus === 'danger' || no2Status === 'danger' ? 'DANGER' : 'WARNING'}</span>
                <div>
                  <h3 className={`font-semibold ${coStatus === 'danger' || no2Status === 'danger' ? 'text-red-800' : 'text-yellow-800'}`}>
                    {coStatus === 'danger' || no2Status === 'danger' ? 'Evacuation Level Reading' : 'Warning Level Reading'}
                  </h3>
                  <p className="text-sm text-gray-700">This reading exceeded safety thresholds</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="card">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Rink</div>
                  <div className="font-medium">{submission.rink?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Submitted By</div>
                  <div className="font-medium">{submission.submittedBy?.firstName} {submission.submittedBy?.lastName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{new Date(submission.submittedAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Time</div>
                  <div className="font-medium">{new Date(submission.submittedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card text-center">
                <div className="text-sm text-gray-500 mb-2">Carbon Monoxide (CO)</div>
                <div className="text-4xl font-bold mb-2">{data?.coPpm ?? '--'}</div>
                <div className="text-sm text-gray-500 mb-3">ppm</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[coStatus]}`}>
                  {coStatus === 'danger' ? 'EVACUATION' : coStatus === 'warning' ? 'Warning' : 'Normal'}
                </span>
              </div>
              <div className="card text-center">
                <div className="text-sm text-gray-500 mb-2">Nitrogen Dioxide (NO2)</div>
                <div className="text-4xl font-bold mb-2">{data?.no2Ppm ?? '--'}</div>
                <div className="text-sm text-gray-500 mb-3">ppm</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[no2Status]}`}>
                  {no2Status === 'danger' ? 'EVACUATION' : no2Status === 'warning' ? 'Warning' : 'Normal'}
                </span>
              </div>
            </div>

            {(data?.temperature || data?.humidity) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Conditions</h2>
                <div className="grid grid-cols-2 gap-4">
                  {data?.temperature && (
                    <div>
                      <div className="text-sm text-gray-500">Temperature</div>
                      <div className="text-xl font-semibold">{data.temperature}°F</div>
                    </div>
                  )}
                  {data?.humidity && (
                    <div>
                      <div className="text-sm text-gray-500">Humidity</div>
                      <div className="text-xl font-semibold">{data.humidity}%</div>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={data?.resurfacerRunning ? 'text-yellow-600' : 'text-gray-400'}>
                      {data?.resurfacerRunning ? '✓' : '○'}
                    </span>
                    <span className="text-sm text-gray-600">Resurfacer running during reading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={data?.doorsOpen ? 'text-green-600' : 'text-gray-400'}>
                      {data?.doorsOpen ? '✓' : '○'}
                    </span>
                    <span className="text-sm text-gray-600">Doors/vents open</span>
                  </div>
                </div>
              </div>
            )}

            {data?.notes && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-gray-600">{data.notes}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
