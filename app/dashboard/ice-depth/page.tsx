'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import IceDepthDiagram, {
  PRESET_25_POINTS,
  PRESET_35_POINTS,
  PRESET_47_POINTS,
  MeasurementPoint,
} from '@/components/specialized/IceDepthDiagram'

interface Rink {
  id: string
  name: string
  dimensions: string | null
  iceDepthConfig: {
    preset?: string
    customPoints?: MeasurementPoint[]
    targetDepth?: number
    toleranceRange?: number
  } | null
}

interface Submission {
  id: string
  submittedAt: string
  data: Record<string, any>
  status: string
  submittedBy: {
    firstName: string
    lastName: string
  }
  rink: {
    name: string
  }
}

const PRESETS: Record<string, MeasurementPoint[]> = {
  PRESET_25: PRESET_25_POINTS,
  PRESET_35: PRESET_35_POINTS,
  PRESET_47: PRESET_47_POINTS,
}

export default function IceDepthPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [selectedRinkId, setSelectedRinkId] = useState<string>('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [mode, setMode] = useState<'list' | 'new' | 'view'>('list')
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null)
  const [values, setValues] = useState<Record<string, number | null>>({})
  const [outsideTemp, setOutsideTemp] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [iceAge, setIceAge] = useState<string>('')
  const [lastResurface, setLastResurface] = useState<string>('')

  // Fetch rinks and submissions on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch rinks
      const rinksRes = await fetch('/api/rinks')
      if (rinksRes.ok) {
        const data = await rinksRes.json()
        setRinks(data.rinks || [])
        if (data.rinks?.length > 0 && !selectedRinkId) {
          setSelectedRinkId(data.rinks[0].id)
        }
      }

      // Fetch submissions
      const subsRes = await fetch('/api/submissions?moduleType=ICE_DEPTH&limit=20')
      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubmissions(data.submissions || [])
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const selectedRink = rinks.find(r => r.id === selectedRinkId)

  const getMeasurementPoints = (): MeasurementPoint[] => {
    if (!selectedRink) return PRESET_25_POINTS

    const config = selectedRink.iceDepthConfig
    if (!config) return PRESET_25_POINTS

    if (config.customPoints && config.customPoints.length > 0) {
      return config.customPoints
    }

    if (config.preset && PRESETS[config.preset]) {
      return PRESETS[config.preset]
    }

    return PRESET_25_POINTS
  }

  const getTargetDepth = (): number => {
    return selectedRink?.iceDepthConfig?.targetDepth || 1.25
  }

  const getToleranceRange = (): number => {
    return selectedRink?.iceDepthConfig?.toleranceRange || 0.125
  }

  const handleValueChange = (pointId: string, value: number | null) => {
    setValues(prev => ({ ...prev, [pointId]: value }))
  }

  const handleStartNew = () => {
    setValues({})
    setOutsideTemp('')
    setNotes('')
    setIceAge('')
    setLastResurface('')
    setMode('new')
    setError(null)
    setSuccess(null)
  }

  const handleViewSubmission = (submission: Submission) => {
    setViewingSubmission(submission)
    setMode('view')
  }

  const handleSubmit = async () => {
    if (!selectedRinkId) {
      setError('Please select a rink')
      return
    }

    const measurementPoints = getMeasurementPoints()
    const filledCount = Object.values(values).filter(v => v !== null).length

    if (filledCount < measurementPoints.length * 0.5) {
      setError(`Please complete at least 50% of measurements (${Math.ceil(measurementPoints.length * 0.5)} points)`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // First, get a form template for ice depth
      const templatesRes = await fetch('/api/form-templates?moduleType=ICE_DEPTH')
      let formTemplateId: string | null = null

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        if (data.templates?.length > 0) {
          formTemplateId = data.templates[0].id
        }
      }

      // If no template exists, create a default one
      if (!formTemplateId) {
        const createTemplateRes = await fetch('/api/form-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Ice Depth Measurement',
            moduleType: 'ICE_DEPTH',
            schema: {
              sections: [{
                id: 'measurements',
                title: 'Ice Depth Measurements',
                fields: []
              }]
            },
            isDefault: true,
          }),
        })

        if (createTemplateRes.ok) {
          const data = await createTemplateRes.json()
          formTemplateId = data.template.id
        }
      }

      if (!formTemplateId) {
        throw new Error('Could not find or create form template')
      }

      // Calculate statistics
      const filledValues = Object.values(values).filter((v): v is number => v !== null)
      const average = filledValues.reduce((a, b) => a + b, 0) / filledValues.length
      const min = Math.min(...filledValues)
      const max = Math.max(...filledValues)

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId,
          rinkId: selectedRinkId,
          data: {
            measurements: values,
            statistics: {
              average: average.toFixed(2),
              min: min.toFixed(2),
              max: max.toFixed(2),
              range: (max - min).toFixed(2),
              pointsCompleted: filledValues.length,
              totalPoints: measurementPoints.length,
            },
            notes,
            iceAge,
            lastResurface,
            targetDepth: getTargetDepth(),
            toleranceRange: getToleranceRange(),
          },
          outsideTemp: outsideTemp ? parseFloat(outsideTemp) : null,
          outsideTempUnit: 'F',
          status: 'SUBMITTED',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setSuccess('Ice depth measurements submitted successfully!')
      setMode('list')
      fetchData() // Refresh submissions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit measurements')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ice Depth Measurements</h1>
          <p className="text-gray-600">Record and track ice thickness across your rink surface</p>
        </div>
        {mode === 'list' && (
          <button onClick={handleStartNew} className="btn btn-primary">
            + New Measurement
          </button>
        )}
        {(mode === 'new' || mode === 'view') && (
          <button onClick={() => setMode('list')} className="btn btn-secondary">
            ← Back to List
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* List View */}
      {mode === 'list' && (
        <div className="space-y-6">
          {/* Recent Submissions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recent Measurements</h2>
            {submissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No ice depth measurements recorded yet. Click "New Measurement" to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rink</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Average</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Range</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Submitted By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">{sub.rink.name}</td>
                        <td className="py-3 px-4 font-mono">
                          {sub.data.statistics?.average || '--'}"
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {sub.data.statistics?.min || '--'}" - {sub.data.statistics?.max || '--'}"
                        </td>
                        <td className="py-3 px-4">
                          {sub.submittedBy.firstName} {sub.submittedBy.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            sub.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            sub.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewSubmission(sub)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Measurement Form */}
      {mode === 'new' && (
        <div className="space-y-6">
          {/* Rink Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Select Rink</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rinks.map((rink) => (
                <button
                  key={rink.id}
                  onClick={() => setSelectedRinkId(rink.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedRinkId === rink.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{rink.name}</div>
                  <div className="text-sm text-gray-500">
                    {rink.dimensions || 'Standard'} • {getMeasurementPoints().length} points
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Session Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outside Temperature (°F)
                </label>
                <input
                  type="number"
                  value={outsideTemp}
                  onChange={(e) => setOutsideTemp(e.target.value)}
                  placeholder="e.g., 72"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ice Age (days)
                </label>
                <input
                  type="number"
                  value={iceAge}
                  onChange={(e) => setIceAge(e.target.value)}
                  placeholder="e.g., 14"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Resurface
                </label>
                <input
                  type="datetime-local"
                  value={lastResurface}
                  onChange={(e) => setLastResurface(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations..."
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Ice Depth Diagram */}
          {selectedRink && (
            <div className="card">
              <IceDepthDiagram
                rinkName={selectedRink.name}
                dimensions={selectedRink.dimensions || '200x85'}
                measurementPoints={getMeasurementPoints()}
                values={values}
                onChange={handleValueChange}
                targetDepth={getTargetDepth()}
                toleranceRange={getToleranceRange()}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setMode('list')}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Measurements'}
            </button>
          </div>
        </div>
      )}

      {/* View Submission */}
      {mode === 'view' && viewingSubmission && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Ice Depth Report - {viewingSubmission.rink.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Submitted {new Date(viewingSubmission.submittedAt).toLocaleString()} by{' '}
                  {viewingSubmission.submittedBy.firstName} {viewingSubmission.submittedBy.lastName}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                viewingSubmission.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                viewingSubmission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                viewingSubmission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {viewingSubmission.status}
              </span>
            </div>

            {/* Statistics */}
            {viewingSubmission.data.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewingSubmission.data.statistics.average}"
                  </div>
                  <div className="text-sm text-gray-500">Average</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewingSubmission.data.statistics.min}"
                  </div>
                  <div className="text-sm text-gray-500">Minimum</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewingSubmission.data.statistics.max}"
                  </div>
                  <div className="text-sm text-gray-500">Maximum</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewingSubmission.data.statistics.range}"
                  </div>
                  <div className="text-sm text-gray-500">Range</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {viewingSubmission.data.statistics.pointsCompleted}/{viewingSubmission.data.statistics.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">Points</div>
                </div>
              </div>
            )}

            {/* Diagram (read-only) */}
            <IceDepthDiagram
              rinkName={viewingSubmission.rink.name}
              dimensions="200x85"
              measurementPoints={getMeasurementPoints()}
              values={viewingSubmission.data.measurements || {}}
              onChange={() => {}}
              readOnly
              targetDepth={viewingSubmission.data.targetDepth || 1.25}
              toleranceRange={viewingSubmission.data.toleranceRange || 0.125}
            />

            {/* Notes */}
            {viewingSubmission.data.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Notes</h3>
                <p className="text-gray-600">{viewingSubmission.data.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
