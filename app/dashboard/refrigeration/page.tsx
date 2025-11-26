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

export default function RefrigerationPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [headerData, setHeaderData] = useState<HeaderData>(createDefaultHeaderData())
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [rinksRes, templatesRes, submissionsRes] = await Promise.all([
          fetch('/api/rinks'),
          fetch('/api/form-templates?moduleType=REFRIGERATION&isActive=true'),
          fetch('/api/submissions?moduleType=REFRIGERATION&limit=5'),
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
      setSuccess('Refrigeration report submitted successfully!')
      setFormValues({})
      setHeaderData(createDefaultHeaderData(headerData.rinkId))
      setRecentSubmissions((prev) => [submission, ...prev.slice(0, 4)])

      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg
              className="w-6 h-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refrigeration Report</h1>
            <p className="text-gray-500">Monitor refrigeration system readings</p>
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

      {/* Quick Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Brine Temp</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">--°F</div>
          <div className="text-xs text-gray-400 mt-1">Last reading</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Suction PSI</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">--</div>
          <div className="text-xs text-gray-400 mt-1">Last reading</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Head PSI</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">--</div>
          <div className="text-xs text-gray-400 mt-1">Last reading</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Compressor</div>
          <div className="text-2xl font-bold text-green-600 mt-1">OK</div>
          <div className="text-xs text-gray-400 mt-1">Status</div>
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
            <p className="mb-4">No refrigeration form template has been configured.</p>
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
                  <div>
                    <span className="font-medium text-gray-900">
                      {submission.rink.name}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      by {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/submissions?moduleType=REFRIGERATION"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all readings →
          </Link>
        </div>
      )}
    </div>
  )
}
