'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UniversalHeader, FormRenderer, createDefaultHeaderData, HeaderData } from '@/components/submissions'
import { FormSchema } from '@/types/form-builder'

interface Rink {
  id: string
  name: string
  facilityId: string
}

interface FormTemplate {
  id: string
  name: string
  moduleType: string
  version: number
  schema: FormSchema
}

interface Submission {
  id: string
  submittedAt: string
  status: string
  rink: { name: string }
  submittedBy: { firstName: string; lastName: string }
  data: any
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  moderate: 'bg-orange-100 text-orange-800 border-orange-300',
  severe: 'bg-red-100 text-red-800 border-red-300',
  ambulance: 'bg-red-500 text-white border-red-700',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
}

export default function IncidentsPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [headerData, setHeaderData] = useState<HeaderData>(createDefaultHeaderData())
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [rinksRes, templatesRes, submissionsRes] = await Promise.all([
          fetch('/api/rinks'),
          fetch('/api/form-templates?moduleType=INCIDENT&isActive=true'),
          fetch('/api/submissions?moduleType=INCIDENT&limit=10'),
        ])

        if (rinksRes.ok) {
          const rinksData = await rinksRes.json()
          setRinks(rinksData)
          if (rinksData.length === 1) {
            setHeaderData((prev) => ({ ...prev, rinkId: rinksData[0].id }))
          }
        }

        if (templatesRes.ok) {
          const templates = await templatesRes.json()
          if (templates.length > 0) {
            setTemplate(templates[0])
          }
        }

        if (submissionsRes.ok) {
          const data = await submissionsRes.json()
          setRecentSubmissions(data.submissions || [])
        }
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (values: Record<string, any>) => {
    if (!template) {
      setError('No form template available')
      return
    }

    if (!headerData.rinkId) {
      setError('Please select a rink')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: template.id,
          rinkId: headerData.rinkId,
          submittedAt: headerData.submittedAt,
          outsideTemp: headerData.outsideTemp,
          outsideTempUnit: headerData.outsideTempUnit,
          data: values,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit')
      }

      const submission = await response.json()
      setSuccess('Incident report submitted successfully! It will be reviewed by a manager.')
      setFormValues({})
      setHeaderData(createDefaultHeaderData(headerData.rinkId))
      setRecentSubmissions((prev) => [submission, ...prev.slice(0, 9)])
      setShowForm(false)

      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = recentSubmissions.filter((s) => s.status === 'PENDING_REVIEW').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
              <p className="text-gray-500">Report and track facility incidents</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Incident
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Quick Stats */}
      {!showForm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Pending Review</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">This Month</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{recentSubmissions.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Ambulance Calls</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {recentSubmissions.filter((s) => s.data?.severity === 'ambulance').length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Approved</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {recentSubmissions.filter((s) => s.status === 'APPROVED').length}
            </div>
          </div>
        </div>
      )}

      {/* Incident Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">New Incident Report</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <UniversalHeader
            value={headerData}
            onChange={setHeaderData}
            rinks={rinks}
            disabled={isSubmitting}
          />

          {/* Severity Quick Select */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Severity
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['minor', 'moderate', 'severe', 'ambulance'].map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setFormValues((prev) => ({ ...prev, severity }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formValues.severity === severity
                      ? SEVERITY_COLORS[severity] + ' border-current'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium capitalize">{severity}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {severity === 'minor' && 'First aid only'}
                    {severity === 'moderate' && 'Medical attention'}
                    {severity === 'severe' && 'Hospital visit'}
                    {severity === 'ambulance' && 'Called 911'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {template ? (
            <FormRenderer
              schema={template.schema}
              initialValues={formValues}
              onChange={setFormValues}
              onSubmit={handleSubmit}
              disabled={isSubmitting}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No incident form template has been configured.</p>
              <Link
                href="/dashboard/admin/forms/new"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create a form template
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Recent Incidents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Incidents
        </h2>
        {recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/dashboard/submissions/${submission.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[submission.status] || 'bg-gray-100 text-gray-800'}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                      {submission.data?.severity && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${SEVERITY_COLORS[submission.data.severity] || ''}`}>
                          {submission.data.severity}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-gray-900">
                      {submission.data?.incident_type || 'Incident'} at {submission.rink.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Reported by {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                    </div>
                    {submission.data?.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {submission.data.description}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                    <br />
                    {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No incidents reported yet.
          </div>
        )}
        {recentSubmissions.length > 0 && (
          <Link
            href="/dashboard/submissions?moduleType=INCIDENT"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all incidents →
          </Link>
        )}
      </div>
    </div>
  )
}
