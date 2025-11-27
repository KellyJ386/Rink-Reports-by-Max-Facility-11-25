'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import IceDepthGrid from '@/components/modules/IceDepthGrid'

interface Submission {
  id: string
  submittedAt: string
  outsideTemp: number | null
  outsideTempUnit: string
  submittedById: string
  data: {
    measurements: Array<{ pointId: string; value: number }>
    notes?: string
  }
  rink: {
    id: string
    name: string
    iceDepthConfiguration?: {
      presetType: string
      targetDepth: number
      optimalTolerance: number
      warningTolerance: number
    }
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  formTemplate: {
    name: string
    version: number
  }
}

export default function IceDepthDetailPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<Submission | null>(null)
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
        throw new Error(data.error || 'Failed to load submission')
      }

      setSubmission(data.submission)
      setEditData(data.submission.data || {})
      setEditOutsideTemp(data.submission.outsideTemp?.toString() || '')

      // Check if user can edit
      const meResponse = await fetch('/api/auth/me')
      if (meResponse.ok) {
        const meData = await meResponse.json()
        const isOwner = data.submission.submittedById === meData.user?.id
        const hasEditPerm = meData.user?.role?.permissions?.iceDepth?.edit
        setCanEdit(isOwner || hasEditPerm)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission')
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

      setSubmission({
        ...submission!,
        data: editData,
        outsideTemp: editOutsideTemp ? parseFloat(editOutsideTemp) : null,
      })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(submission?.data || {})
    setEditOutsideTemp(submission?.outsideTemp?.toString() || '')
    setIsEditing(false)
    setError('')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ice depth reading? This action cannot be undone.')) {
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

      router.push('/dashboard/ice-depth')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleMeasurementChange = (newValues: Record<string, number>) => {
    // Convert the values record to measurements array
    const measurements = Object.entries(newValues).map(([pointId, value]) => ({
      pointId,
      value,
    }))
    setEditData({ ...editData, measurements })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-500 text-5xl mb-4">Error</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reading</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/dashboard/ice-depth" className="btn btn-secondary">
          Back to Ice Depth
        </Link>
      </div>
    )
  }

  if (!submission) return null

  const data = isEditing ? editData : submission.data

  // Convert measurements array to Record for the grid
  const measurementValues: Record<string, number> = {}
  data.measurements?.forEach((m: any) => {
    measurementValues[m.pointId] = m.value
  })

  // Calculate stats
  const measurements = data.measurements || []
  const avgDepth = measurements.length > 0
    ? (measurements.reduce((sum: number, m: any) => sum + m.value, 0) / measurements.length).toFixed(3)
    : '--'
  const minDepth = measurements.length > 0
    ? Math.min(...measurements.map((m: any) => m.value)).toFixed(3)
    : '--'
  const maxDepth = measurements.length > 0
    ? Math.max(...measurements.map((m: any) => m.value)).toFixed(3)
    : '--'

  const presetType = submission.rink.iceDepthConfiguration?.presetType || 'RINK_25'
  const config = submission.rink.iceDepthConfiguration
  const targetDepth = config?.targetDepth || 1.25
  const optimalTolerance = config?.optimalTolerance || 0.125
  const warningTolerance = config?.warningTolerance || 0.25

  const getStatus = (value: number) => {
    const diff = Math.abs(value - targetDepth)
    if (diff <= optimalTolerance) {
      return { label: 'Optimal', color: 'bg-green-100 text-green-800' }
    } else if (diff <= warningTolerance) {
      return value > targetDepth
        ? { label: 'Thick', color: 'bg-blue-100 text-blue-800' }
        : { label: 'Thin', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { label: 'Critical', color: 'bg-red-100 text-red-800' }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ice-depth" className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ice Depth Reading</h1>
            <p className="text-gray-600 text-sm mt-1">
              {submission.rink.name} - {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Print
            </button>
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
          {/* Outside Temperature */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conditions</h2>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outside Temperature ({submission.outsideTempUnit})
              </label>
              <input
                type="number"
                value={editOutsideTemp}
                onChange={(e) => setEditOutsideTemp(e.target.value)}
                className="input"
                placeholder="Enter temperature"
              />
            </div>
          </div>

          {/* Ice Depth Grid (Editable) */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurements</h2>
            <IceDepthGrid
              presetType={presetType as any}
              values={measurementValues}
              onChange={handleMeasurementChange}
            />
          </div>

          {/* Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="input"
              rows={3}
              placeholder="Add notes about ice conditions..."
            />
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
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Rink</div>
              <div className="font-semibold text-blue-600">{submission.rink.name}</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Outside Temp</div>
              <div className="font-semibold">
                {submission.outsideTemp !== null
                  ? `${submission.outsideTemp}°${submission.outsideTempUnit}`
                  : '--'}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Submitted By</div>
              <div className="font-semibold">
                {submission.submittedBy.firstName} {submission.submittedBy.lastName}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500 mb-1">Points Measured</div>
              <div className="font-semibold">{measurements.length}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-sm text-gray-500 mb-1">Average Depth</div>
              <div className="text-3xl font-bold text-gray-900">{avgDepth}"</div>
            </div>
            <div className="card text-center">
              <div className="text-sm text-gray-500 mb-1">Minimum</div>
              <div className="text-3xl font-bold text-red-600">{minDepth}"</div>
            </div>
            <div className="card text-center">
              <div className="text-sm text-gray-500 mb-1">Maximum</div>
              <div className="text-3xl font-bold text-blue-600">{maxDepth}"</div>
            </div>
          </div>

          {/* Target Info */}
          <div className="card mb-6 bg-blue-50">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-blue-700">Target Depth:</span>
                <span className="font-semibold text-blue-900 ml-1">{targetDepth}"</span>
              </div>
              <div>
                <span className="text-blue-700">Optimal Range:</span>
                <span className="font-semibold text-blue-900 ml-1">
                  {(targetDepth - optimalTolerance).toFixed(3)}" - {(targetDepth + optimalTolerance).toFixed(3)}"
                </span>
              </div>
            </div>
          </div>

          {/* Ice Depth Grid (Read-only) */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurement Map</h2>
            <IceDepthGrid
              presetType={presetType as any}
              values={measurementValues}
              onChange={() => {}}
              readOnly
            />
          </div>

          {/* Notes */}
          {submission.data.notes && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-gray-600">{submission.data.notes}</p>
            </div>
          )}

          {/* Measurements Table */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Measurements</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Point</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Depth (inches)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m: any, index: number) => {
                    const status = getStatus(m.value)
                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{m.pointId}</td>
                        <td className="py-2 px-3 text-right font-mono">{m.value.toFixed(3)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
