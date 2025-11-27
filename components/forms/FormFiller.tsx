'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FormSchema, FormField, ValidationRule, ConditionalRule } from '@/types/form-builder'
import FieldRenderer from '../form-builder/fields'

interface FormFillerProps {
  schema: FormSchema
  initialData?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onSaveDraft?: (data: Record<string, unknown>) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitButtonText?: string
  showDraftButton?: boolean
  disabled?: boolean
}

interface FieldError {
  fieldId: string
  message: string
}

export default function FormFiller({
  schema,
  initialData = {},
  onSubmit,
  onSaveDraft,
  onCancel,
  isLoading = false,
  submitButtonText,
  showDraftButton = true,
  disabled = false,
}: FormFillerProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get all fields from all sections
  const allFields = schema.sections.flatMap((section) => section.fields)

  // Evaluate conditional rules to determine field visibility/state
  const evaluateCondition = useCallback((rule: ConditionalRule): boolean => {
    const fieldValue = formData[rule.fieldId]

    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value
      case 'notEquals':
        return fieldValue !== rule.value
      case 'contains':
        return String(fieldValue || '').includes(String(rule.value || ''))
      case 'greaterThan':
        return Number(fieldValue) > Number(rule.value)
      case 'lessThan':
        return Number(fieldValue) < Number(rule.value)
      case 'isEmpty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
      case 'isNotEmpty':
        return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
      default:
        return false
    }
  }, [formData])

  // Get effective field state based on conditional rules
  const getFieldState = useCallback((field: FormField) => {
    const state = {
      visible: true,
      required: field.validation?.some((v) => v.type === 'required') || false,
      disabled: disabled || field.isLocked || false,
    }

    if (field.conditionalRules && field.conditionalRules.length > 0) {
      for (const rule of field.conditionalRules) {
        const conditionMet = evaluateCondition(rule)

        switch (rule.action) {
          case 'show':
            if (!conditionMet) state.visible = false
            break
          case 'hide':
            if (conditionMet) state.visible = false
            break
          case 'require':
            if (conditionMet) state.required = true
            break
          case 'disable':
            if (conditionMet) state.disabled = true
            break
        }
      }
    }

    return state
  }, [evaluateCondition, disabled])

  // Validate a single field
  const validateField = useCallback((field: FormField, value: unknown): string | null => {
    const state = getFieldState(field)

    // Skip validation for hidden fields
    if (!state.visible) return null

    const rules = field.validation || []

    // Add required rule if conditionally required
    if (state.required && !rules.some((r) => r.type === 'required')) {
      rules.push({ type: 'required', message: 'This field is required' })
    }

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
            return rule.message || 'This field is required'
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
        case 'minLength':
          if (typeof value === 'string' && value.length < Number(rule.value)) {
            return rule.message || `Minimum length is ${rule.value} characters`
          }
          break
        case 'maxLength':
          if (typeof value === 'string' && value.length > Number(rule.value)) {
            return rule.message || `Maximum length is ${rule.value} characters`
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
      }
    }

    return null
  }, [getFieldState])

  // Validate all fields
  const validateAll = useCallback((): FieldError[] => {
    const fieldErrors: FieldError[] = []

    for (const field of allFields) {
      const error = validateField(field, formData[field.id])
      if (error) {
        fieldErrors.push({ fieldId: field.id, message: error })
      }
    }

    return fieldErrors
  }, [allFields, formData, validateField])

  // Handle field change
  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))

    // Clear error when field is modified
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  // Handle field blur (for validation on touch)
  const handleFieldBlur = (fieldId: string) => {
    setTouched((prev) => ({ ...prev, [fieldId]: true }))

    const field = allFields.find((f) => f.id === fieldId)
    if (field) {
      const error = validateField(field, formData[fieldId])
      if (error) {
        setErrors((prev) => ({ ...prev, [fieldId]: error }))
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    allFields.forEach((f) => { allTouched[f.id] = true })
    setTouched(allTouched)

    // Validate all fields
    const fieldErrors = validateAll()

    if (fieldErrors.length > 0) {
      const errorMap: Record<string, string> = {}
      fieldErrors.forEach((e) => { errorMap[e.fieldId] = e.message })
      setErrors(errorMap)

      // Scroll to first error
      const firstErrorField = document.getElementById(`field-${fieldErrors[0].fieldId}`)
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle save draft
  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      setIsSubmitting(true)
      try {
        await onSaveDraft(formData)
      } catch (error) {
        console.error('Draft save error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Auto-save draft periodically
  useEffect(() => {
    if (!schema.settings?.autoSave || !onSaveDraft) return

    const timer = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        onSaveDraft(formData).catch(console.error)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(timer)
  }, [formData, onSaveDraft, schema.settings?.autoSave])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {schema.sections.map((section) => (
        <div key={section.id} className="card">
          {section.title && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {section.fields.map((field) => {
              const state = getFieldState(field)

              // Skip hidden fields
              if (!state.visible) return null

              return (
                <div key={field.id} id={`field-${field.id}`}>
                  <FieldRenderer
                    field={{
                      ...field,
                      validation: state.required && !field.validation?.some((v) => v.type === 'required')
                        ? [...(field.validation || []), { type: 'required', message: 'Required' }]
                        : field.validation,
                    }}
                    value={formData[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    disabled={state.disabled || isLoading || isSubmitting}
                    error={touched[field.id] ? errors[field.id] : undefined}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {allFields.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <p>No fields in this form</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {showDraftButton && onSaveDraft && schema.settings?.allowDraft !== false && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn btn-secondary"
              disabled={isLoading || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || isSubmitting || allFields.length === 0}
          >
            {isSubmitting ? 'Submitting...' : (submitButtonText || schema.settings?.submitButtonText || 'Submit')}
          </button>
        </div>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700">
            {Object.entries(errors).map(([fieldId, message]) => {
              const field = allFields.find((f) => f.id === fieldId)
              return (
                <li key={fieldId}>
                  {field?.label || fieldId}: {message}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </form>
  )
}
