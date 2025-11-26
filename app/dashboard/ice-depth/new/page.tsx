'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import IceDepthGrid from '@/components/modules/IceDepthGrid'

interface Rink {
  id: string
  name: string
  iceDepthConfiguration?: {
    presetType: string
    measurementPoints: any[]
  }
}

export default function NewIceDepthPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedRink, setSelectedRink] = useState('')
  const [outsideTemp, setOutsideTemp] = useState('')
  const [notes, setNotes] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, number>>({})

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
          setSelectedRink(data.rinks[0].id)
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

    if (!selectedRink) {
      setError('Please select a rink')
      return
    }

    if (Object.keys(measurements).length === 0) {
      setError('Please enter at least one measurement')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // First, we need to get or create a form template for ice depth
      // For now, we'll create a submission with the data directly
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: 'ice-depth-default', // We'll need to handle this
          rinkId: selectedRink,
          outsideTemp: outsideTemp ? parseFloat(outsideTemp) : null,
          data: {
            measurements: Object.entries(measurements).map(([pointId, value]) => ({
              pointId,
              value,
            })),
            notes,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      router.push('/dashboard/ice-depth')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reading')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedRinkData = rinks.find((r) => r.id === selectedRink)
  const presetType = selectedRinkData?.iceDepthConfiguration?.presetType || 'RINK_25'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/ice-depth" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Ice Depth Reading</h1>
          <p className="text-gray-600 text-sm mt-1">Record ice thickness measurements</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reading Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rink <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRink}
                onChange={(e) => setSelectedRink(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a rink...</option>
                {rinks.map((rink) => (
                  <option key={rink.id} value={rink.id}>
                    {rink.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outside Temperature
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={outsideTemp}
                  onChange={(e) => setOutsideTemp(e.target.value)}
                  className="input rounded-r-none"
                  placeholder="--"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                  °F
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date/Time
              </label>
              <input
                type="text"
                value={new Date().toLocaleString()}
                className="input bg-gray-50"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Ice Depth Grid */}
        {selectedRink ? (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Measurements - {selectedRinkData?.name}
            </h2>
            <IceDepthGrid
              presetType={presetType as any}
              values={measurements}
              onChange={setMeasurements}
            />
          </div>
        ) : (
          <div className="card mb-6 text-center py-12 text-gray-400">
            <p>Select a rink to begin measurements</p>
          </div>
        )}

        {/* Notes */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            rows={3}
            placeholder="Optional notes about this reading..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {Object.keys(measurements).length} points measured
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/ice-depth" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedRink || Object.keys(measurements).length === 0}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Reading'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
