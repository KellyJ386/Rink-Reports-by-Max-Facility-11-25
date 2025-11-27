'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function AirQualityDetailPage() {
  const params = useParams()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        <Link href="/dashboard/air-quality" className="btn btn-secondary">Back</Link>
      </div>
    )
  }

  const data = submission.data as any
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Air Quality Reading</h1>
          <p className="text-gray-600 text-sm mt-1">
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Alert if any */}
      {(coStatus !== 'normal' || no2Status !== 'normal') && (
        <div className={`p-4 mb-6 rounded-lg ${coStatus === 'danger' || no2Status === 'danger' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-yellow-100 border-l-4 border-yellow-500'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{coStatus === 'danger' || no2Status === 'danger' ? '🚨' : '⚠️'}</span>
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
              <div className="font-medium">{submission.rink.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Submitted By</div>
              <div className="font-medium">{submission.submittedBy.firstName} {submission.submittedBy.lastName}</div>
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
    </div>
  )
}
