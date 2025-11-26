'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormRenderer } from '@/components/submissions'
import { FormSchema } from '@/types/form-builder'

interface Submission {
  id: string
  submittedAt: string
  status: string
  outsideTemp: number | null
  outsideTempUnit: string
  formVersionAtSubmission: number
  data: any
  formTemplate: {
    id: string
    name: string
    moduleType: string
    version: number
    schema: FormSchema
  }
  rink: {
    id: string
    name: string
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-300',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-green-100 text-green-700 border-green-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
}

export default function SubmissionViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const response = await fetch(`/api/submissions/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Submission not found')
          }
          throw new Error('Failed to fetch submission')
        }
        const data = await response.json()
        setSubmission(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submission')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmission()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading submission...</div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error || 'Submission not found'}</p>
          <Link
            href="/dashboard/submissions"
            className="mt-4 inline-block text-red-600 hover:text-red-700"
          >
            ← Back to Submissions
          </Link>
        </div>
      </div>
    )
  }

  const moduleLabel = MODULE_LABELS[submission.formTemplate.moduleType] || submission.formTemplate.moduleType

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/submissions"
          className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block"
        >
          ← Back to Submissions
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {submission.formTemplate.name}
            </h1>
            <p className="text-gray-500">
              {moduleLabel} Report • {submission.rink.name}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded border ${STATUS_COLORS[submission.status] || ''}`}>
            {submission.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Submission Meta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Submission Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-gray-500">Submitted</div>
            <div className="font-medium text-gray-900">
              {new Date(submission.submittedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Submitted By</div>
            <div className="font-medium text-gray-900">
              {submission.submittedBy.firstName} {submission.submittedBy.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {submission.submittedBy.email}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Outside Temp</div>
            <div className="font-medium text-gray-900">
              {submission.outsideTemp !== null
                ? `${submission.outsideTemp}°${submission.outsideTempUnit}`
                : '--'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Form Version</div>
            <div className="font-medium text-gray-900">
              v{submission.formVersionAtSubmission}
              {submission.formVersionAtSubmission !== submission.formTemplate.version && (
                <span className="text-xs text-amber-600 ml-1">
                  (current: v{submission.formTemplate.version})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Data */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Report Data
        </h2>
        <FormRenderer
          schema={submission.formTemplate.schema}
          initialValues={submission.data}
          disabled={true}
        />
      </div>

      {/* Actions for Incidents */}
      {submission.formTemplate.moduleType === 'INCIDENT' && submission.status === 'PENDING_REVIEW' && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">
            Review Required
          </h2>
          <p className="text-amber-700 mb-4">
            This incident report requires manager review and approval.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
              Approve
            </button>
            <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Raw Data (for debugging) */}
      <details className="mt-6">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          View raw data
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(submission.data, null, 2)}
        </pre>
      </details>
    </div>
  )
}
