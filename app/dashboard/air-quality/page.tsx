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
  rink: { name: string }
  submittedBy: { firstName: string; lastName: string }
  data: any
}

// Air quality thresholds (from OSHA/facility settings)
const THRESHOLDS = {
  co: {
    safe: 20,
    warning: 35,
    evacuation: 83,
    unit: 'ppm',
  },
  no2: {
    safe: 0.3,
    warning: 1.0,
    evacuation: 2.0,
    unit: 'ppm',
  },
}

function getStatusColor(value: number | null, threshold: typeof THRESHOLDS.co) {
  if (value === null) return 'gray'
  if (value >= threshold.evacuation) return 'red'
  if (value >= threshold.warning) return 'amber'
  if (value >= threshold.safe) return 'yellow'
  return 'green'
}

function getStatusLabel(value: number | null, threshold: typeof THRESHOLDS.co) {
  if (value === null) return 'No Data'
  if (value >= threshold.evacuation) return 'EVACUATE'
  if (value >= threshold.warning) return 'WARNING'
  if (value >= threshold.safe) return 'CAUTION'
  return 'SAFE'
}

export default function AirQualityPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [headerData, setHeaderData] = useState<HeaderData>(createDefaultHeaderData())
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Current readings (would come from latest submission)
  const [currentCO, setCurrentCO] = useState<number | null>(null)
  const [currentNO2, setCurrentNO2] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [rinksRes, templatesRes, submissionsRes] = await Promise.all([
          fetch('/api/rinks'),
          fetch('/api/form-templates?moduleType=AIR_QUALITY&isActive=true'),
          fetch('/api/submissions?moduleType=AIR_QUALITY&limit=5'),
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
          const submissions = data.submissions || []
          setRecentSubmissions(submissions)

          // Extract latest readings from most recent submission
          if (submissions.length > 0 && submissions[0].data) {
            const latestData = submissions[0].data
            if (latestData.co_level !== undefined) setCurrentCO(latestData.co_level)
            if (latestData.no2_level !== undefined) setCurrentNO2(latestData.no2_level)
          }
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
      setSuccess('Air quality report submitted successfully!')
      setFormValues({})
      setHeaderData(createDefaultHeaderData(headerData.rinkId))
      setRecentSubmissions((prev) => [submission, ...prev.slice(0, 4)])

      // Update current readings
      if (values.co_level !== undefined) setCurrentCO(values.co_level)
      if (values.no2_level !== undefined) setCurrentNO2(values.no2_level)

      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const coStatus = getStatusColor(currentCO, THRESHOLDS.co)
  const no2Status = getStatusColor(currentNO2, THRESHOLDS.no2)

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
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <svg
              className="w-6 h-6 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Air Quality Report</h1>
            <p className="text-gray-500">Monitor CO and NO2 levels for compliance</p>
          </div>
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

      {/* Air Quality Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* CO Level Card */}
        <div className={`rounded-xl border-2 p-6 ${
          coStatus === 'red' ? 'bg-red-50 border-red-500' :
          coStatus === 'amber' ? 'bg-amber-50 border-amber-500' :
          coStatus === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
          coStatus === 'green' ? 'bg-green-50 border-green-500' :
          'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Carbon Monoxide (CO)</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              coStatus === 'red' ? 'bg-red-500 text-white' :
              coStatus === 'amber' ? 'bg-amber-500 text-white' :
              coStatus === 'yellow' ? 'bg-yellow-500 text-gray-900' :
              coStatus === 'green' ? 'bg-green-500 text-white' :
              'bg-gray-300 text-gray-700'
            }`}>
              {getStatusLabel(currentCO, THRESHOLDS.co)}
            </span>
          </div>
          <div className="text-4xl font-bold mb-2">
            {currentCO !== null ? `${currentCO} ppm` : '-- ppm'}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Safe: &lt; {THRESHOLDS.co.safe} ppm</div>
            <div>Warning: {THRESHOLDS.co.warning} ppm</div>
            <div className="text-red-600 font-medium">Evacuation: {THRESHOLDS.co.evacuation} ppm</div>
          </div>
        </div>

        {/* NO2 Level Card */}
        <div className={`rounded-xl border-2 p-6 ${
          no2Status === 'red' ? 'bg-red-50 border-red-500' :
          no2Status === 'amber' ? 'bg-amber-50 border-amber-500' :
          no2Status === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
          no2Status === 'green' ? 'bg-green-50 border-green-500' :
          'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nitrogen Dioxide (NO2)</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              no2Status === 'red' ? 'bg-red-500 text-white' :
              no2Status === 'amber' ? 'bg-amber-500 text-white' :
              no2Status === 'yellow' ? 'bg-yellow-500 text-gray-900' :
              no2Status === 'green' ? 'bg-green-500 text-white' :
              'bg-gray-300 text-gray-700'
            }`}>
              {getStatusLabel(currentNO2, THRESHOLDS.no2)}
            </span>
          </div>
          <div className="text-4xl font-bold mb-2">
            {currentNO2 !== null ? `${currentNO2} ppm` : '-- ppm'}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Safe: &lt; {THRESHOLDS.no2.safe} ppm</div>
            <div>Warning: {THRESHOLDS.no2.warning} ppm</div>
            <div className="text-red-600 font-medium">Evacuation: {THRESHOLDS.no2.evacuation} ppm</div>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <UniversalHeader
          value={headerData}
          onChange={setHeaderData}
          rinks={rinks}
          disabled={isSubmitting}
        />

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
            <p className="mb-4">No air quality form template has been configured.</p>
            <Link
              href="/dashboard/admin/forms/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create a form template
            </Link>
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Readings
          </h2>
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/dashboard/submissions/${submission.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">
                      {submission.rink.name}
                    </span>
                    {submission.data?.co_level !== undefined && (
                      <span className="text-sm text-gray-600">
                        CO: {submission.data.co_level} ppm
                      </span>
                    )}
                    {submission.data?.no2_level !== undefined && (
                      <span className="text-sm text-gray-600">
                        NO2: {submission.data.no2_level} ppm
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/submissions?moduleType=AIR_QUALITY"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all readings →
          </Link>
        </div>
      )}
    </div>
  )
}
