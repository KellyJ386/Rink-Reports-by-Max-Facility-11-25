'use client'

import { useState, useCallback } from 'react'
import { FormField, FormSchema, ValidationRule } from '@/types/form-builder'
import { FieldRenderer } from './fields'

interface FormPreviewProps {
  schema: FormSchema
  initialData?: Record<string, any>
  onSubmit?: (data: Record<string, any>) => void
  isSubmitting?: boolean
  readOnly?: boolean
}

export default function FormPreview({
  schema,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  readOnly = false,
}: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    setTouched((prev) => ({ ...prev, [fieldName]: true }))
    // Clear error when user starts typing
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const validateField = (field: FormField, value: any): string | null => {
    if (!field.validation) return null

    for (const rule of field.validation) {
      const error = validateRule(rule, value, field.label)
      if (error) return error
    }

    return null
  }

  const validateRule = (
    rule: ValidationRule,
    value: any,
    label: string
  ): string | null => {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message || `${label} is required`
        }
        if (Array.isArray(value) && value.length === 0) {
          return rule.message || `${label} is required`
        }
        break

      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message || `${label} must be at least ${rule.value}`
        }
        break

      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message || `${label} must be at most ${rule.value}`
        }
        break

      case 'minLength':
        if (
          typeof value === 'string' &&
          value.length < (rule.value as number)
        ) {
          return (
            rule.message ||
            `${label} must be at least ${rule.value} characters`
          )
        }
        break

      case 'maxLength':
        if (
          typeof value === 'string' &&
          value.length > (rule.value as number)
        ) {
          return (
            rule.message || `${label} must be at most ${rule.value} characters`
          )
        }
        break

      case 'pattern':
        if (typeof value === 'string') {
          const regex = new RegExp(rule.value as string)
          if (!regex.test(value)) {
            return rule.message || `${label} format is invalid`
          }
        }
        break
    }

    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fields = schema.fields as FormField[]

    for (const field of fields) {
      if (field.type === 'section' || field.type === 'divider') continue
      if (field.isHidden) continue

      const value = values[field.name]
      const error = validateField(field, value)
      if (error) {
        newErrors[field.name] = error
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (readOnly) return

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    for (const field of schema.fields as FormField[]) {
      if (field.type !== 'section' && field.type !== 'divider') {
        allTouched[field.name] = true
      }
    }
    setTouched(allTouched)

    if (validateForm()) {
      onSubmit?.(values)
    }
  }

  const fields = schema.fields as FormField[]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap -mx-1">
        {fields.map((field) => {
          if (field.isHidden) return null

          return (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.name]}
              onChange={(value) => handleChange(field.name, value)}
              error={touched[field.name] ? errors[field.name] : undefined}
              disabled={readOnly || isSubmitting}
            />
          )
        })}
      </div>

      {!readOnly && (
        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    </form>
  )
}
