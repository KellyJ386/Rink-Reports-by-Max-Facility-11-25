'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { FieldRenderer } from '@/components/form-builder/fields'
import { evaluateCondition, validateFormData } from '@/types/form-builder'
import type { FormSchema, FormField } from '@/types/form-builder'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Rink {
  id: string
  name: string
}

export default function FillFormPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [template, setTemplate] = useState<{
    id: string
    name: string
    description?: string
    schema: FormSchema
  } | null>(null)
  const [rinks, setRinks] = useState<Rink[]>([])
  const [selectedRink, setSelectedRink] = useState<string>('')
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchTemplate = useCallback(async () => {
    try {
      const [templateRes, rinksRes] = await Promise.all([
        fetch(`/api/forms/${id}`),
        fetch('/api/rinks'),
      ])

      if (!templateRes.ok) throw new Error('Failed to fetch form')

      const templateData = await templateRes.json()
      setTemplate(templateData.template)

      if (rinksRes.ok) {
        const rinksData = await rinksRes.json()
        setRinks(rinksData.rinks || [])
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditionalLogic) return true

    const result = evaluateCondition(field.conditionalLogic, formData)

    if (field.conditionalLogic.action === 'show') {
      return result
    } else if (field.conditionalLogic.action === 'hide') {
      return !result
    }

    return true
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!template) return

    setSubmitError(null)

    // Validate unless saving as draft
    if (!isDraft) {
      const validation = validateFormData(template.schema, formData)
      if (!validation.valid) {
        setErrors(validation.errors)
        // Scroll to first error
        const firstErrorField = Object.keys(validation.errors)[0]
        const element = document.querySelector(`[name="${firstErrorField}"]`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: id,
          rinkId: selectedRink || undefined,
          data: formData,
          isDraft,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.errors) {
          setErrors(data.errors)
          return
        }
        throw new Error(data.error || 'Failed to submit form')
      }

      // Redirect to submissions list or success page
      router.push('/dashboard/submissions?status=success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading form...</div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Form not found or not available.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
        {template.description && (
          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        )}
      </div>

      {/* Rink Selection */}
      {rinks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Rink (Optional)
          </label>
          <select
            value={selectedRink}
            onChange={(e) => setSelectedRink(e.target.value)}
            className="input"
          >
            <option value="">-- No specific rink --</option>
            {rinks.map((rink) => (
              <option key={rink.id} value={rink.id}>
                {rink.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Banner */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {submitError}
        </div>
      )}

      {/* Form Sections */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        {template.schema.sections.map((section) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            {section.title && (
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-sm text-gray-500 mb-4">{section.description}</p>
            )}

            <div className="space-y-4">
              {section.fields
                .filter(shouldShowField)
                .map((field) => (
                  <div key={field.id}>
                    <FieldRenderer
                      field={field}
                      value={formData[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      error={errors[field.name]}
                      disabled={submitting}
                      formData={formData}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="btn btn-secondary disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Draft'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
