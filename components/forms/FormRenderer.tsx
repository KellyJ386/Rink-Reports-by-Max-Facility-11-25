'use client'

import { useState, useCallback, useMemo } from 'react'
import type { FormSchema, FormField } from '@/components/form-builder/types'
import { fieldRegistry } from '@/components/form-builder/fields'

interface FormRendererProps {
  schema: FormSchema
  initialValues?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  disabled?: boolean
  submitLabel?: string
  showValidation?: boolean
}

interface FieldError {
  field: string
  message: string
}

export function FormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  disabled = false,
  submitLabel = 'Submit',
  showValidation = true,
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  // Get all fields from all sections
  const allFields = useMemo(() => {
    return schema.sections.flatMap((section) => section.fields)
  }, [schema])

  // Validate a single field
  const validateField = useCallback((field: FormField, value: unknown): string | null => {
    // Required check
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        return `${field.label} is required`
      }
      if (Array.isArray(value) && value.length === 0) {
        return `${field.label} is required`
      }
    }

    // Type-specific validation
    if (value !== undefined && value !== null && value !== '') {
      const validation = field.validation

      if (validation) {
        // Number validation
        if (field.type === 'number' && typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            return `${field.label} must be at least ${validation.min}`
          }
          if (validation.max !== undefined && value > validation.max) {
            return `${field.label} must be at most ${validation.max}`
          }
        }

        // Text validation
        if (typeof value === 'string') {
          if (validation.minLength !== undefined && value.length < validation.minLength) {
            return `${field.label} must be at least ${validation.minLength} characters`
          }
          if (validation.maxLength !== undefined && value.length > validation.maxLength) {
            return `${field.label} must be at most ${validation.maxLength} characters`
          }
          if (validation.pattern) {
            const regex = new RegExp(validation.pattern)
            if (!regex.test(value)) {
              return validation.patternMessage || `${field.label} has an invalid format`
            }
          }
        }
      }

      // Email validation
      if (field.type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address'
        }
      }

      // Phone validation
      if (field.type === 'phone' && typeof value === 'string') {
        const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/
        if (!phoneRegex.test(value)) {
          return 'Please enter a valid phone number'
        }
      }
    }

    return null
  }, [])

  // Validate all fields
  const validateAll = useCallback((): FieldError[] => {
    const fieldErrors: FieldError[] = []

    allFields.forEach((field) => {
      const error = validateField(field, values[field.id])
      if (error) {
        fieldErrors.push({ field: field.id, message: error })
      }
    })

    return fieldErrors
  }, [allFields, values, validateField])

  // Handle field change
  const handleChange = useCallback(
    (fieldId: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }))

      // Validate on change if field was touched
      if (touched[fieldId] && showValidation) {
        const field = allFields.find((f) => f.id === fieldId)
        if (field) {
          const error = validateField(field, value)
          setErrors((prev) => {
            if (error) {
              return { ...prev, [fieldId]: error }
            }
            const { [fieldId]: _, ...rest } = prev
            return rest
          })
        }
      }
    },
    [touched, allFields, validateField, showValidation]
  )

  // Handle field blur (mark as touched)
  const handleBlur = useCallback(
    (fieldId: string) => {
      setTouched((prev) => ({ ...prev, [fieldId]: true }))

      if (showValidation) {
        const field = allFields.find((f) => f.id === fieldId)
        if (field) {
          const error = validateField(field, values[fieldId])
          setErrors((prev) => {
            if (error) {
              return { ...prev, [fieldId]: error }
            }
            const { [fieldId]: _, ...rest } = prev
            return rest
          })
        }
      }
    },
    [allFields, values, validateField, showValidation]
  )

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    allFields.forEach((field) => {
      allTouched[field.id] = true
    })
    setTouched(allTouched)

    // Validate all fields
    const fieldErrors = validateAll()
    if (fieldErrors.length > 0) {
      const errorMap: Record<string, string> = {}
      fieldErrors.forEach((err) => {
        errorMap[err.field] = err.message
      })
      setErrors(errorMap)

      // Scroll to first error
      const firstErrorField = document.getElementById(fieldErrors[0].field)
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {schema.sections.map((section) => (
        <div key={section.id} className="bg-white rounded-lg shadow-sm border p-6">
          {/* Section header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            {section.description && (
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
            )}
          </div>

          {/* Section fields */}
          <div className="space-y-4">
            {section.fields.map((field) => {
              const config = fieldRegistry[field.type]
              if (!config) {
                return (
                  <div key={field.id} className="p-4 bg-red-50 rounded text-red-600">
                    Unknown field type: {field.type}
                  </div>
                )
              }

              const RenderComponent = config.RenderComponent
              const fieldError = showValidation && touched[field.id] ? errors[field.id] : undefined

              return (
                <div
                  key={field.id}
                  id={field.id}
                  onBlur={() => handleBlur(field.id)}
                >
                  <RenderComponent
                    field={field}
                    value={values[field.id]}
                    onChange={(value) => handleChange(field.id, value)}
                    error={fieldError}
                    disabled={disabled || submitting}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={disabled || submitting}
          className="btn btn-primary min-w-[120px]"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}

// Read-only view component
interface FormViewProps {
  schema: FormSchema
  values: Record<string, unknown>
}

export function FormView({ schema, values }: FormViewProps) {
  return (
    <div className="space-y-8">
      {schema.sections.map((section) => (
        <div key={section.id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            {section.description && (
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
            )}
          </div>

          <dl className="space-y-4">
            {section.fields.map((field) => {
              const value = values[field.id]
              let displayValue: React.ReactNode = '-'

              if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                  displayValue = value.join(', ')
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No'
                } else if (typeof value === 'object') {
                  // For ice depth grid, show summary
                  const entries = Object.entries(value as Record<string, unknown>)
                  const filledEntries = entries.filter(([, v]) => v !== null && v !== undefined)
                  displayValue = `${filledEntries.length} measurements recorded`
                } else if (field.type === 'signature' && typeof value === 'string') {
                  displayValue = (
                    <img
                      src={value}
                      alt="Signature"
                      className="max-h-20 border rounded"
                    />
                  )
                } else if (field.type === 'photo' && typeof value === 'string') {
                  displayValue = (
                    <img
                      src={value}
                      alt="Photo"
                      className="max-h-48 rounded"
                    />
                  )
                } else {
                  displayValue = String(value)
                }
              }

              return (
                <div key={field.id} className="flex flex-col sm:flex-row sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500 sm:w-1/3">
                    {field.label}
                  </dt>
                  <dd className="text-sm text-gray-900 sm:w-2/3 mt-1 sm:mt-0">
                    {displayValue}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      ))}
    </div>
  )
}
