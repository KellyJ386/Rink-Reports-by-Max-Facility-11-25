'use client'

import { useState, useMemo } from 'react'
import { FormSchema, FormField, shouldShowField, evaluateCalculatedField } from '@/types/form-builder'
import { FieldRenderer } from '@/components/form-builder/fields'

interface FormRendererProps {
  schema: FormSchema
  initialValues?: Record<string, any>
  onChange?: (values: Record<string, any>) => void
  onSubmit?: (values: Record<string, any>) => void
  disabled?: boolean
  errors?: Record<string, string>
}

export default function FormRenderer({
  schema,
  initialValues = {},
  onChange,
  onSubmit,
  disabled = false,
  errors = {},
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Get visible fields based on conditional logic
  const visibleFields = useMemo(() => {
    return schema.fields.filter((field) =>
      shouldShowField(field, schema.fields, values)
    )
  }, [schema.fields, values])

  // Validate a single field
  const validateField = (field: FormField, value: any): string | null => {
    // Required validation
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        return `${field.label} is required`
      }
      if (Array.isArray(value) && value.length === 0) {
        return `${field.label} is required`
      }
    }

    // Skip further validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return null
    }

    // Validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case 'minLength':
            if (typeof value === 'string' && value.length < Number(rule.value)) {
              return rule.message || `Minimum ${rule.value} characters required`
            }
            break
          case 'maxLength':
            if (typeof value === 'string' && value.length > Number(rule.value)) {
              return rule.message || `Maximum ${rule.value} characters allowed`
            }
            break
          case 'min':
            if (typeof value === 'number' && value < Number(rule.value)) {
              return rule.message || `Minimum value is ${rule.value}`
            }
            break
          case 'max':
            if (typeof value === 'number' && value > Number(rule.value)) {
              return rule.message || `Maximum value is ${rule.value}`
            }
            break
          case 'pattern':
            if (typeof value === 'string' && rule.value) {
              const regex = new RegExp(String(rule.value))
              if (!regex.test(value)) {
                return rule.message || 'Invalid format'
              }
            }
            break
          case 'email':
            if (typeof value === 'string') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (!emailRegex.test(value)) {
                return rule.message || 'Invalid email address'
              }
            }
            break
          case 'phone':
            if (typeof value === 'string') {
              const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
              if (!phoneRegex.test(value)) {
                return rule.message || 'Invalid phone number'
              }
            }
            break
        }
      }
    }

    return null
  }

  // Validate all fields
  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    for (const field of visibleFields) {
      // Skip non-input fields
      if (field.type === 'section' || field.type === 'divider') continue

      const error = validateField(field, values[field.name])
      if (error) {
        newErrors[field.name] = error
        isValid = false
      }
    }

    setValidationErrors(newErrors)
    return isValid
  }

  // Handle field value change
  const handleChange = (fieldName: string, value: any) => {
    const newValues = { ...values, [fieldName]: value }

    // Update calculated fields
    for (const field of schema.fields) {
      if (field.type === 'calculated' && field.calculatedConfig) {
        const calculatedValue = evaluateCalculatedField(field.calculatedConfig, schema.fields, newValues)
        if (calculatedValue !== null) {
          newValues[field.name] = calculatedValue
        }
      }
    }

    setValues(newValues)
    onChange?.(newValues)

    // Clear error when field is modified
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  // Handle field blur (for validation)
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }))

    // Validate on blur
    const field = schema.fields.find((f) => f.name === fieldName)
    if (field) {
      const error = validateField(field, values[fieldName])
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [fieldName]: error }))
      }
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    for (const field of schema.fields) {
      allTouched[field.name] = true
    }
    setTouched(allTouched)

    // Validate all fields
    if (validateAll()) {
      onSubmit?.(values)
    }
  }

  // Merge validation errors with external errors
  const allErrors = { ...validationErrors, ...errors }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex flex-wrap">
        {visibleFields.map((field) => {
          const fieldError = touched[field.name] ? allErrors[field.name] : undefined

          return (
            <div
              key={field.id}
              className={`${getWidthClass(field.width)} p-2`}
            >
              <FieldRenderer
                field={field}
                value={values[field.name]}
                onChange={(value) => handleChange(field.name, value)}
                error={fieldError}
                disabled={disabled}
                allFields={schema.fields}
                formValues={values}
              />
              {/* Show error message */}
              {fieldError && (
                <p className="mt-1 text-sm text-red-600">{fieldError}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit button */}
      {onSubmit && (
        <div className="pt-6 border-t border-gray-200 mt-6">
          <button
            type="submit"
            disabled={disabled}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Report
          </button>
        </div>
      )}
    </form>
  )
}

// Helper to get Tailwind width class
function getWidthClass(width?: 'full' | 'half' | 'third' | 'quarter'): string {
  switch (width) {
    case 'quarter':
      return 'w-full md:w-1/4'
    case 'third':
      return 'w-full md:w-1/3'
    case 'half':
      return 'w-full md:w-1/2'
    case 'full':
    default:
      return 'w-full'
  }
}
