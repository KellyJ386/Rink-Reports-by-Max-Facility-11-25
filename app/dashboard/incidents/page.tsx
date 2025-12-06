'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

interface Submission {
  id: string
  submittedAt: string
  status: string
  reviewNotes: string | null
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
  formTemplate: { id: string; name: string }
  data: Record<string, unknown>
}

const INCIDENT_TYPES = [
  { id: 'Injury - Minor', label: 'Minor Injury', icon: '🩹' },
  { id: 'Injury - Major', label: 'Major Injury', icon: '🚑' },
  { id: 'Equipment Failure', label: 'Equipment Failure', icon: '⚙️' },
  { id: 'Property Damage', label: 'Property Damage', icon: '🔨' },
  { id: 'Safety Hazard', label: 'Safety Hazard', icon: '⚠️' },
  { id: 'Other', label: 'Other Incident', icon: '📋' }
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Reviewed', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Needs Follow-up', color: 'bg-red-100 text-red-800' },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' }
}

export default function IncidentsPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showReview, setShowReview] = useState<Submission | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedRink, setSelectedRink] = useState('')
  const [incidentType, setIncidentType] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [injuredPerson, setInjuredPerson] = useState('')
  const [injuryType, setInjuryType] = useState('')
  const [ambulanceCalled, setAmbulanceCalled] = useState(false)
  const [witnesses, setWitnesses] = useState('')
  const [actionTaken, setActionTaken] = useState('')

  // Review state
  const [reviewNotes, setReviewNotes] = useState('')

  // Filter state
  const [filterRink, setFilterRink] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterRink) params.set('rinkId', filterRink)
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`/api/incidents?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRinks(data.rinks || [])
        setSubmissions(data.submissions || [])
        setPendingCount(data.pendingCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterRink, filterStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRink || !incidentType || !description) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRink,
          incidentType,
          data: {
            incidentDate: incidentDate || new Date().toISOString(),
            location,
            description,
            injuredPerson: injuredPerson || null,
            injuryType: injuryType || null,
            ambulanceCalled,
            witnesses: witnesses || null,
            actionTaken: actionTaken || null
          }
        })
      })

      if (res.ok) {
        setShowForm(false)
        resetForm()
        fetchData()
      } else {
        alert('Failed to save incident')
      }
    } catch (error) {
      alert('Failed to save incident')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async (status: string) => {
    if (!showReview) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: showReview.id,
          status,
          reviewNotes
        })
      })

      if (res.ok) {
        setShowReview(null)
        setReviewNotes('')
        fetchData()
      } else {
        alert('Failed to update incident')
      }
    } catch (error) {
      alert('Failed to update incident')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedRink('')
    setIncidentType('')
    setIncidentDate('')
    setLocation('')
    setDescription('')
    setInjuredPerson('')
    setInjuryType('')
    setAmbulanceCalled(false)
    setWitnesses('')
    setActionTaken('')
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600 mt-1">Report and track incidents and injuries</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {pendingCount} pending review
            </span>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            + Report Incident
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {INCIDENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setIncidentType(type.id)
              setShowForm(true)
            }}
            className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-300 transition-colors"
          >
            <span className="text-2xl mb-1">{type.icon}</span>
            <span className="text-sm text-gray-700 text-center">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rink</label>
            <select
              value={filterRink}
              onChange={(e) => setFilterRink(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Rinks</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>{rink.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Reviewed</option>
              <option value="REJECTED">Needs Follow-up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Incident Reports</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No incidents reported. Click "Report Incident" to file a report.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => {
              const data = sub.data as Record<string, unknown>
              const statusInfo = STATUS_LABELS[sub.status] || STATUS_LABELS.SUBMITTED

              return (
                <div
                  key={sub.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => { setShowReview(sub); setReviewNotes(sub.reviewNotes || '') }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {INCIDENT_TYPES.find(t => t.id === sub.formTemplate.name)?.icon || '📋'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {sub.formTemplate.name}
                          {data.ambulanceCalled === true && (
                            <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full">
                              AMBULANCE
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sub.rink.name} • {sub.submittedBy.firstName} {sub.submittedBy.lastName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <div className="text-sm text-gray-500">{formatDateTime(sub.submittedAt)}</div>
                    </div>
                  </div>
                  {data.description != null && (
                    <div className="mt-2 ml-11 text-sm text-gray-600 line-clamp-2">
                      {String(data.description)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Report Incident Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-red-50">
              <h2 className="font-semibold text-red-900">Report Incident</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rink *</label>
                  <select
                    value={selectedRink}
                    onChange={(e) => setSelectedRink(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select rink...</option>
                    {rinks.map((rink) => (
                      <option key={rink.id} value={rink.id}>{rink.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type *</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select type...</option>
                    {INCIDENT_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date/Time</label>
                  <input
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specific Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Near bench area"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Describe what happened..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Injury Details (if applicable)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Injured Person</label>
                    <input
                      type="text"
                      value={injuredPerson}
                      onChange={(e) => setInjuredPerson(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Injury Type</label>
                    <input
                      type="text"
                      value={injuryType}
                      onChange={(e) => setInjuryType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Sprained ankle"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ambulanceCalled}
                      onChange={(e) => setAmbulanceCalled(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm font-medium text-red-700">Ambulance was called</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Witnesses</label>
                <textarea
                  value={witnesses}
                  onChange={(e) => setWitnesses(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Names and contact info of any witnesses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken</label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="What was done to address the situation?"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRink || !incidentType || !description}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Incident Details</h2>
              <button onClick={() => setShowReview(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{showReview.formTemplate.name}</div>
                  <div className="text-sm text-gray-500">{showReview.rink.name}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[showReview.status]?.color || ''}`}>
                  {STATUS_LABELS[showReview.status]?.label || showReview.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                <div><strong>Reported by:</strong> {showReview.submittedBy.firstName} {showReview.submittedBy.lastName}</div>
                <div><strong>Date:</strong> {formatDateTime(showReview.submittedAt)}</div>
                {(showReview.data as Record<string, unknown>).location != null && (
                  <div><strong>Location:</strong> {String((showReview.data as Record<string, unknown>).location)}</div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                <div className="text-sm text-gray-600">
                  {String((showReview.data as Record<string, unknown>).description || 'No description')}
                </div>
              </div>

              {(showReview.data as Record<string, unknown>).injuredPerson != null && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-800">Injury Information</div>
                  <div className="text-sm text-red-700 mt-1">
                    <div>Person: {String((showReview.data as Record<string, unknown>).injuredPerson)}</div>
                    {(showReview.data as Record<string, unknown>).injuryType != null && (
                      <div>Type: {String((showReview.data as Record<string, unknown>).injuryType)}</div>
                    )}
                    {(showReview.data as Record<string, unknown>).ambulanceCalled === true && (
                      <div className="font-bold">⚠️ Ambulance was called</div>
                    )}
                  </div>
                </div>
              )}

              {showReview.status === 'PENDING_REVIEW' && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Add any follow-up notes..."
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleReview('REJECTED')}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                    >
                      Needs Follow-up
                    </button>
                    <button
                      onClick={() => handleReview('APPROVED')}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </div>
              )}

              {showReview.reviewNotes && showReview.status !== 'PENDING_REVIEW' && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-1">Review Notes</div>
                  <div className="text-sm text-gray-600">{showReview.reviewNotes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
