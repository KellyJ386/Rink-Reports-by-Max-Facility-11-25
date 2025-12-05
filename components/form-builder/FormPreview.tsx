'use client'

import { useState } from 'react'
import { FormSchema, FormField, FormSection } from '@/types'
import { FieldRenderer } from './FieldRenderer'

interface FormPreviewProps {
  schema: FormSchema
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  readOnly?: boolean
  initialData?: Record<string, unknown>
  title?: string
  description?: string
}

export function FormPreview({
  schema,
  onSubmit,
  onCancel,
  readOnly = false,
  initialData = {},
  title,
  description,
}: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors((prev) => {
        const { [fieldName]: _, ...rest } = prev
        return rest
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const value = formData[field.name]

        // Required validation
        if (field.required) {
          if (value === undefined || value === null || value === '') {
            newErrors[field.name] = `${field.label} is required`
          } else if (Array.isArray(value) && value.length === 0) {
            newErrors[field.name] = `${field.label} is required`
          }
        }

        // Number validation
        if (field.type === 'number' && value !== undefined && value !== '') {
          const numValue = Number(value)
          if (field.min !== undefined && numValue < field.min) {
            newErrors[field.name] = `${field.label} must be at least ${field.min}`
          }
          if (field.max !== undefined && numValue > field.max) {
            newErrors[field.name] = `${field.label} must be at most ${field.max}`
          }
        }

        // Text length validation
        if (['text', 'textarea', 'email', 'phone'].includes(field.type) && value) {
          const strValue = String(value)
          if (field.minLength !== undefined && strValue.length < field.minLength) {
            newErrors[field.name] = `${field.label} must be at least ${field.minLength} characters`
          }
          if (field.maxLength !== undefined && strValue.length > field.maxLength) {
            newErrors[field.name] = `${field.label} must be at most ${field.maxLength} characters`
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (readOnly || !onSubmit) return

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const allFields = schema.sections.flatMap((section) => section.fields)

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {/* Form header */}
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
      )}

      {/* Form sections */}
      {schema.sections.map((section) => (
        <div key={section.id} className="card p-6 mb-6">
          {section.title && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                error={errors[field.name]}
                disabled={readOnly}
                preview={readOnly}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Form actions */}
      {!readOnly && onSubmit && (
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Submitting...
              </span>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      )}

      {/* Validation errors summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Please fix the following errors:</p>
          <ul className="mt-2 list-disc list-inside text-sm text-red-600">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
