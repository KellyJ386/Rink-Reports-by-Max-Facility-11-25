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

export default function IceOperationsPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [headerData, setHeaderData] = useState<HeaderData>(createDefaultHeaderData())
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [rinksRes, templatesRes, submissionsRes] = await Promise.all([
          fetch('/api/rinks'),
          fetch('/api/form-templates?moduleType=ICE_OPERATIONS&isActive=true'),
          fetch('/api/submissions?moduleType=ICE_OPERATIONS&limit=5'),
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

  // Handle form submission
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      setSuccess('Ice operations report submitted successfully!')
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
          <div className="p-2 bg-cyan-100 rounded-lg">
            <svg
              className="w-6 h-6 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ice Operations Report</h1>
            <p className="text-gray-500">Log ice maintenance activities</p>
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

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* Universal Header */}
        <UniversalHeader
          value={headerData}
          onChange={setHeaderData}
          rinks={rinks}
          disabled={isSubmitting}
        />

        {/* Form Content */}
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
            <p className="mb-4">No ice operations form template has been configured.</p>
            <Link
              href="/dashboard/admin/forms/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create a form template
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          type="button"
          onClick={() => {
            setFormValues((prev) => ({ ...prev, activity_type: 'resurface' }))
          }}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
        >
          <div className="text-2xl mb-1">🧊</div>
          <div className="text-sm font-medium text-gray-700">Resurface</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setFormValues((prev) => ({ ...prev, activity_type: 'edge' }))
          }}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
        >
          <div className="text-2xl mb-1">🔪</div>
          <div className="text-sm font-medium text-gray-700">Edge</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setFormValues((prev) => ({ ...prev, activity_type: 'shave' }))
          }}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
        >
          <div className="text-2xl mb-1">✂️</div>
          <div className="text-sm font-medium text-gray-700">Shave</div>
        </button>
        <button
          type="button"
          onClick={() => {
            setFormValues((prev) => ({ ...prev, activity_type: 'flood' }))
          }}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
        >
          <div className="text-2xl mb-1">💧</div>
          <div className="text-sm font-medium text-gray-700">Flood</div>
        </button>
      </div>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Operations
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
            href="/dashboard/submissions?moduleType=ICE_OPERATIONS"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all operations →
          </Link>
        </div>
      )}
    </div>
  )
}
