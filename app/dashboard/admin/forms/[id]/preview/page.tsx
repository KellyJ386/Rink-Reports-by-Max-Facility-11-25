'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FieldRenderer } from '@/components/form-builder/fields'
import type { FormSchema, FormField } from '@/types/form-builder'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  schema: FormSchema
  version: number
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

export default function PreviewFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/forms/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch template')
      }

      setTemplate(data.template)

      // Initialize form data with default values
      const initialData: Record<string, unknown> = {}
      data.template.schema?.sections?.forEach((section: { fields: FormField[] }) => {
        section.fields?.forEach((field: FormField) => {
          if (field.defaultValue !== undefined) {
            initialData[field.name] = field.defaultValue
          }
        })
      })
      setFormData(initialData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Form data logged to console (preview mode)')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error || 'Template not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 btn btn-secondary"
        >
          Go Back
        </button>
      </div>
    )
  }

  const fields = template.schema?.sections?.[0]?.fields || []

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link
            href="/dashboard/admin/forms"
            className="hover:text-gray-700"
          >
            Forms
          </Link>
          <span>/</span>
          <span>Preview</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {template.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {MODULE_LABELS[template.moduleType]} • Version {template.version}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/admin/forms/${id}`}
              className="btn btn-secondary"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="font-medium">Preview Mode</span>
        </div>
        <p className="text-sm mt-1">
          This is a preview of how the form will appear to users. Data entered
          here will not be saved.
        </p>
      </div>

      {/* Form Preview */}
      <form onSubmit={handleSubmit} className="card">
        {template.description && (
          <p className="text-gray-600 mb-6">{template.description}</p>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>This form has no fields yet.</p>
            <Link
              href={`/dashboard/admin/forms/${id}`}
              className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
            >
              Add fields in the editor
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
              />
            ))}

            <div className="pt-6 border-t border-gray-200">
              <button type="submit" className="btn btn-primary">
                Submit (Preview)
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Form Data Debug */}
      <div className="mt-6 card bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Form Data (Debug)
        </h3>
        <pre className="text-xs text-gray-600 overflow-auto p-3 bg-white rounded border border-gray-200">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
