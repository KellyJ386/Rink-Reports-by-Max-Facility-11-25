'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormSchema } from '@/types'
import { FormPreview } from '@/components/form-builder'
import { ReportHeader } from './ReportHeader'

interface SubmissionFormProps {
  formTemplate: {
    id: string
    name: string
    description?: string | null
    moduleType: string
    schema: FormSchema
  }
  facilityName: string
  rinks?: { id: string; name: string }[]
  onSubmit?: (data: Record<string, unknown>, status: 'DRAFT' | 'SUBMITTED') => Promise<void>
  initialData?: Record<string, unknown>
  initialRinkId?: string
  mode?: 'create' | 'edit'
  submissionId?: string
}

export function SubmissionForm({
  formTemplate,
  facilityName,
  rinks = [],
  onSubmit,
  initialData = {},
  initialRinkId,
  mode = 'create',
  submissionId,
}: SubmissionFormProps) {
  const router = useRouter()
  const [selectedRinkId, setSelectedRinkId] = useState<string>(initialRinkId || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: Record<string, unknown>, status: 'DRAFT' | 'SUBMITTED') => {
    setSaving(true)
    setError(null)

    try {
      if (onSubmit) {
        await onSubmit({ ...data, rinkId: selectedRinkId || undefined }, status)
      } else {
        // Default submission logic
        const url = mode === 'edit' && submissionId
          ? `/api/submissions/${submissionId}`
          : '/api/submissions'

        const res = await fetch(url, {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formTemplateId: formTemplate.id,
            rinkId: selectedRinkId || null,
            data,
            status,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Failed to save submission')
        }

        // Navigate back to module list
        const moduleRoutes: Record<string, string> = {
          ICE_DEPTH: '/dashboard/ice-depth',
          ICE_OPERATIONS: '/dashboard/ice-operations',
          REFRIGERATION: '/dashboard/refrigeration',
          AIR_QUALITY: '/dashboard/air-quality',
          INCIDENT: '/dashboard/incidents',
          SCHEDULE: '/dashboard/schedule',
          DAILY_CHECKLIST: '/dashboard/checklists',
        }

        router.push(moduleRoutes[formTemplate.moduleType] || '/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    await handleSubmit(data, 'SUBMITTED')
  }

  const handleSaveDraft = async (data: Record<string, unknown>) => {
    await handleSubmit(data, 'DRAFT')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportHeader
        title={formTemplate.name}
        moduleType={formTemplate.moduleType}
        facilityName={facilityName}
        rinkName={rinks.find((r) => r.id === selectedRinkId)?.name}
        onBack={() => router.back()}
        actions={
          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
          </div>
        }
      />

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Rink selector */}
        {rinks.length > 0 && (
          <div className="card p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Rink
            </label>
            <select
              value={selectedRinkId}
              onChange={(e) => setSelectedRinkId(e.target.value)}
              className="input w-full max-w-xs"
            >
              <option value="">All Rinks / General</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>
                  {rink.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form */}
        <FormPreview
          schema={formTemplate.schema}
          title={formTemplate.name}
          description={formTemplate.description || undefined}
          initialData={initialData}
          onSubmit={handleFormSubmit}
          onCancel={() => router.back()}
        />

        {/* Save as Draft button */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveDraft(initialData)}
            disabled={saving}
            className="btn btn-secondary"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  )
}
