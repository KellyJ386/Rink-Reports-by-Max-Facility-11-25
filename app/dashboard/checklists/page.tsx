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

export default function ChecklistsPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [todaySubmissions, setTodaySubmissions] = useState<Submission[]>([])
  const [headerData, setHeaderData] = useState<HeaderData>(createDefaultHeaderData())
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get today's date range
  const today = new Date()
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  useEffect(() => {
    async function fetchData() {
      try {
        const [rinksRes, templatesRes, submissionsRes] = await Promise.all([
          fetch('/api/rinks'),
          fetch('/api/form-templates?moduleType=DAILY_CHECKLIST&isActive=true'),
          fetch(`/api/submissions?moduleType=DAILY_CHECKLIST&startDate=${todayStart}&endDate=${todayEnd}`),
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
          setTodaySubmissions(data.submissions || [])
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
      setSuccess('Checklist submitted successfully!')
      setFormValues({})
      setHeaderData(createDefaultHeaderData(headerData.rinkId))
      setTodaySubmissions((prev) => [submission, ...prev])

      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit checklist')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check completion status for each rink
  const getCompletionStatus = () => {
    const completed = new Set(todaySubmissions.map((s) => s.rink.name))
    return rinks.map((rink) => ({
      ...rink,
      completed: completed.has(rink.name),
    }))
  }

  const completionStatus = getCompletionStatus()
  const completedCount = completionStatus.filter((r) => r.completed).length

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
          <div className="p-2 bg-green-100 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Checklists</h1>
            <p className="text-gray-500">Complete daily operational checklists</p>
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

      {/* Today's Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Today's Progress
          </h2>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Completion</span>
            <span className="font-medium text-gray-900">
              {completedCount} / {rinks.length} rinks
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${rinks.length > 0 ? (completedCount / rinks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Rink Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {completionStatus.map((rink) => (
            <div
              key={rink.id}
              className={`p-3 rounded-lg border-2 ${
                rink.completed
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {rink.completed ? (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={`font-medium ${rink.completed ? 'text-green-700' : 'text-gray-600'}`}>
                  {rink.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Submit Checklist
        </h2>

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
            <p className="mb-4">No checklist form template has been configured.</p>
            <Link
              href="/dashboard/admin/forms/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create a form template
            </Link>
          </div>
        )}
      </div>

      {/* Today's Submissions */}
      {todaySubmissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Completed Checklists
          </h2>
          <div className="space-y-3">
            {todaySubmissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/dashboard/submissions/${submission.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-medium text-gray-900">
                        {submission.rink.name}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        by {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/dashboard/submissions?moduleType=DAILY_CHECKLIST"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View all checklists →
          </Link>
        </div>
      )}
    </div>
  )
}
