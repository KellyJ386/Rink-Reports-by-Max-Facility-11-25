'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const OPERATION_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  ice_make: { label: 'Ice Make', icon: '🧊', color: 'bg-blue-100 text-blue-800' },
  circle_check: { label: 'Circle Check', icon: '🔄', color: 'bg-green-100 text-green-800' },
  edging: { label: 'Edging', icon: '📐', color: 'bg-purple-100 text-purple-800' },
  blade_change: { label: 'Blade Change', icon: '🔪', color: 'bg-orange-100 text-orange-800' },
  resurfacing: { label: 'Resurfacing', icon: '🚜', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-800' },
}

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  good: { label: 'Good', color: 'bg-green-100 text-green-800' },
  fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  needs_attention: { label: 'Needs Attention', color: 'bg-orange-100 text-orange-800' },
  replace: { label: 'Replace Soon', color: 'bg-red-100 text-red-800' },
}

export default function IceOperationDetailPage() {
  const params = useParams()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (error || !submission) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/dashboard/ice-operations" className="btn btn-secondary">Back</Link>
      </div>
    )
  }

  const data = submission.data as any
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
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
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

        {/* Operation Details */}
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

        {/* Circle Check Details */}
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

        {/* Notes */}
        {data.notes && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-gray-600">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
