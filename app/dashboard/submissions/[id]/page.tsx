'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FormSchema } from '@/types/forms'

interface SubmissionDetail {
  id: string
  formTemplate: {
    id: string
    name: string
    description: string | null
    moduleType: string
    version: number
    schema: FormSchema
    conditionalRules: any
  }
  rink: {
    id: string
    name: string
    facilityId: string
    facility: {
      id: string
      name: string
    }
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: {
      name: string
    }
  }
  submittedAt: string
  outsideTemp: number | null
  outsideTempUnit: string
  status: string
  data: Record<string, any>
  attachments: Array<{
    id: string
    fieldId: string
    type: string
    fileName: string
    fileSize: number
    mimeType: string
    storageKey: string
    createdAt: string
  }>
}

const moduleTypeLabels: Record<string, string> = {
  ICE_OPERATIONS: 'Ice Operations',
  ICE_DEPTH: 'Ice Depth',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export default function SubmissionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmission()
  }, [params.id])

  const fetchSubmission = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/submissions/${params.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Submission not found')
        } else if (response.status === 403) {
          setError('You do not have permission to view this submission')
        } else {
          setError('Failed to load submission')
        }
        return
      }

      const data = await response.json()
      setSubmission(data.submission)
    } catch (err) {
      console.error('Error fetching submission:', err)
      setError('An error occurred while loading the submission')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-wolf-600">Loading submission...</div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
        <Card className="p-12 text-center">
          <div className="text-wolf-400 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">
            {error || 'Submission not found'}
          </h3>
          <p className="text-wolf-600 mb-6">
            The submission you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button onClick={() => router.push('/dashboard/submissions')}>
            View All Submissions
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back to Submissions
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            🖨️ Print
          </Button>
          <Button variant="outline" onClick={() => alert('Export to PDF - Coming soon!')}>
            📄 Export PDF
          </Button>
        </div>
      </div>

      {/* Submission Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-navy-900">
                {submission.formTemplate.name}
              </h1>
              <Badge variant={statusColors[submission.status]}>
                {submission.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-wolf-600">
              {moduleTypeLabels[submission.formTemplate.moduleType]} •{' '}
              Version {submission.formTemplate.version}
            </p>
          </div>
          <div className="text-right text-sm text-wolf-600">
            <div className="font-mono">{submission.id}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-xs font-medium text-wolf-600 uppercase mb-1">
              Facility
            </div>
            <div className="text-navy-900 font-medium">
              {submission.rink.facility.name}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-wolf-600 uppercase mb-1">
              Rink
            </div>
            <div className="text-navy-900 font-medium">
              {submission.rink.name}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-wolf-600 uppercase mb-1">
              Submitted By
            </div>
            <div className="text-navy-900 font-medium">
              {submission.submittedBy.firstName} {submission.submittedBy.lastName}
            </div>
            <div className="text-xs text-wolf-500">
              {submission.submittedBy.role.name}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-wolf-600 uppercase mb-1">
              Date & Time
            </div>
            <div className="text-navy-900 font-medium">
              {formatDate(submission.submittedAt)}
            </div>
            {submission.outsideTemp !== null && (
              <div className="text-xs text-wolf-500">
                Outside: {submission.outsideTemp}°{submission.outsideTempUnit}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Form Data */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-navy-900 mb-6">Form Data</h2>

        <div className="space-y-8">
          {submission.formTemplate.schema.sections?.map((section) => (
            <div key={section.id}>
              <h3 className="text-lg font-semibold text-navy-800 mb-4 pb-2 border-b border-wolf-200">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-wolf-600 mb-4">
                  {section.description}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields?.map((field) => {
                  const value = submission.data[field.id]
                  const displayValue = formatFieldValue(value)

                  return (
                    <div
                      key={field.id}
                      className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                    >
                      <div className="text-sm font-medium text-navy-700 mb-1">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      <div className="text-navy-900">
                        {field.type === 'textarea' ? (
                          <div className="whitespace-pre-wrap bg-wolf-50 p-3 rounded-lg border border-wolf-200">
                            {displayValue || (
                              <span className="text-wolf-400 italic">
                                No response
                              </span>
                            )}
                          </div>
                        ) : field.type === 'toggle' ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded ${
                                value
                                  ? 'bg-action-green-500'
                                  : 'bg-wolf-300'
                              }`}
                            >
                              {value && (
                                <span className="text-white text-xs flex items-center justify-center">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span>{value ? 'Yes' : 'No'}</span>
                          </div>
                        ) : field.type === 'temperature' ? (
                          <span>
                            {displayValue}°{field.unit || 'F'}
                          </span>
                        ) : displayValue ? (
                          displayValue
                        ) : (
                          <span className="text-wolf-400 italic">
                            No response
                          </span>
                        )}
                      </div>
                      {field.helpText && (
                        <div className="text-xs text-wolf-500 mt-1">
                          {field.helpText}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Attachments */}
      {submission.attachments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Attachments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submission.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="border border-wolf-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">
                    {attachment.type === 'PHOTO' ? '📷' : '✍️'}
                  </div>
                  <div className="text-xs text-wolf-500">
                    {(attachment.fileSize / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div className="text-sm font-medium text-navy-900 mb-1 truncate">
                  {attachment.fileName}
                </div>
                <div className="text-xs text-wolf-500 mb-3">
                  {attachment.type}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
