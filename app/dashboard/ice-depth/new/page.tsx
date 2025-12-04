'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UniversalHeader } from '@/components/reports/UniversalHeader'
import { IceDepthGridFieldRender } from '@/components/form-builder/fields/IceDepthGridField'

interface Facility {
  id: string
  name: string
  rinks: { id: string; name: string }[]
}

interface HeaderData {
  facilityId: string
  rinkId?: string
  dateTime: string
  outsideTemp?: number
  submittedBy: { id: string; name: string }
}

export default function NewIceDepthPage() {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [headerData, setHeaderData] = useState<HeaderData | null>(null)
  const [measurements, setMeasurements] = useState<Record<string, number | null>>({})
  const [notes, setNotes] = useState('')

  // Mock current user - in real app, get from auth context
  const currentUser = { id: 'user_1', name: 'John Doe' }

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities')
      const data = await response.json()

      if (data.success) {
        setFacilities(data.data)
      } else {
        setError('Failed to load facilities')
      }
    } catch {
      setError('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const handleHeaderChange = useCallback((data: HeaderData) => {
    setHeaderData(data)
  }, [])

  const calculateStats = () => {
    const values = Object.values(measurements).filter((v): v is number => v !== null && v !== undefined)
    if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  }

  const handleSubmit = async (asDraft = false) => {
    if (!headerData?.facilityId) {
      setError('Please select a facility')
      return
    }
    if (!headerData?.rinkId) {
      setError('Please select a rink')
      return
    }

    const stats = calculateStats()
    if (!asDraft && stats.count < 5) {
      setError('Please record at least 5 measurement points')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'ICE_DEPTH',
          facilityId: headerData.facilityId,
          rinkId: headerData.rinkId,
          status: asDraft ? 'DRAFT' : 'SUBMITTED',
          data: {
            measurements,
            notes,
            outsideTemp: headerData.outsideTemp,
            stats: calculateStats(),
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/ice-depth/${data.data.id}`)
      } else {
        setError(data.error?.message || 'Failed to save reading')
      }
    } catch {
      setError('Failed to save reading')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ice-depth" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Ice Depth Reading</h1>
            <p className="text-gray-500">Record ice thickness measurements across the rink</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Universal Header */}
      <UniversalHeader
        facilities={facilities}
        currentUser={currentUser}
        onChange={handleHeaderChange}
        requireRink={true}
        showWeather={true}
        disabled={submitting}
      />

      {/* Ice Depth Grid */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ice Depth Measurements</h2>
        <p className="text-sm text-gray-500 mb-4">
          Click on a measurement point to enter its ice depth. Target depth is typically 0.75&quot; - 1.25&quot;.
        </p>

        <IceDepthGridFieldRender
          field={{
            id: 'ice_depth_grid',
            type: 'iceDepthGrid',
            label: 'Ice Depth Grid',
            required: true,
          }}
          value={measurements}
          onChange={(value) => setMeasurements(value as Record<string, number | null>)}
          disabled={submitting}
        />
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reading Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.count > 0 ? stats.avg.toFixed(2) : '-'}
            </div>
            <div className="text-sm text-gray-500">Average (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.count > 0 ? stats.min.toFixed(2) : '-'}
            </div>
            <div className="text-sm text-gray-500">Minimum (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {stats.count > 0 ? stats.max.toFixed(2) : '-'}
            </div>
            <div className="text-sm text-gray-500">Maximum (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.count}/25</div>
            <div className="text-sm text-gray-500">Points Recorded</div>
          </div>
        </div>

        {/* Depth Status Indicator */}
        {stats.count > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            {stats.avg >= 0.75 && stats.avg <= 1.25 ? (
              <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ice depth is within optimal range (0.75&quot; - 1.25&quot;)</span>
              </div>
            ) : stats.avg < 0.75 ? (
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Ice depth is below minimum - consider adding ice</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Ice depth is above optimal - consider trimming ice</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="input w-full"
          placeholder="Any additional observations or notes about the ice condition..."
          disabled={submitting}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Link href="/dashboard/ice-depth" className="btn btn-secondary">
          Cancel
        </Link>
        <button
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="btn btn-secondary"
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting || stats.count < 5}
          className="btn btn-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Reading'}
        </button>
      </div>
    </div>
  )
}
