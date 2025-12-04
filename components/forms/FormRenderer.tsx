'use client'

import { useState, useCallback, useMemo } from 'react'
import { FormSchema, FormSection, FormField, FormSubmissionData, ValidationResult } from '@/types/forms'
import { FieldRenderer } from './fields'

interface FormRendererProps {
  schema: FormSchema
  initialData?: FormSubmissionData
  onSubmit: (data: FormSubmissionData) => Promise<void>
  onSaveDraft?: (data: FormSubmissionData) => Promise<void>
  readOnly?: boolean
  submitButtonText?: string
}

export default function FormRenderer({
  schema,
  initialData = {},
  onSubmit,
  onSaveDraft,
  readOnly = false,
  submitButtonText = 'Submit',
}: FormRendererProps) {
  const [formData, setFormData] = useState<FormSubmissionData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Get all fields from all sections
  const allFields = useMemo(() => {
    return schema.sections.flatMap((section) => section.fields)
  }, [schema])

  // Update field value
  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }, [errors])

  // Validate a single field
  const validateField = useCallback((field: FormField, value: any): string | null => {
    const { validation } = field

    // Required check
    if (validation?.required) {
      if (value === null || value === undefined || value === '') {
        return validation.customMessage || `${field.label} is required`
      }
      if (Array.isArray(value) && value.length === 0) {
        return validation.customMessage || `${field.label} is required`
      }
    }

    // Skip further validation if empty and not required
    if (value === null || value === undefined || value === '') {
      return null
    }

    // String validations
    if (typeof value === 'string') {
      if (validation?.minLength && value.length < validation.minLength) {
        return `${field.label} must be at least ${validation.minLength} characters`
      }
      if (validation?.maxLength && value.length > validation.maxLength) {
        return `${field.label} must be at most ${validation.maxLength} characters`
      }
      if (validation?.pattern) {
        const regex = new RegExp(validation.pattern)
        if (!regex.test(value)) {
          return validation.patternMessage || `${field.label} has an invalid format`
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (validation?.min !== undefined && value < validation.min) {
        return `${field.label} must be at least ${validation.min}`
      }
      if (validation?.max !== undefined && value > validation.max) {
        return `${field.label} must be at most ${validation.max}`
      }
    }

    return null
  }, [])

  // Validate entire form
  const validateForm = useCallback((): ValidationResult => {
    const newErrors: Record<string, string[]> = {}
    let isValid = true

    for (const field of allFields) {
      // Skip layout fields
      if (['section', 'heading', 'paragraph'].includes(field.type)) continue

      const value = formData[field.name]
      const error = validateField(field, value)

      if (error) {
        isValid = false
        newErrors[field.name] = [error]
      }
    }

    return { isValid, errors: newErrors }
  }, [allFields, formData, validateField])

  // Check if field should be visible based on conditional rules
  const isFieldVisible = useCallback((field: FormField): boolean => {
    if (!field.conditionalRules || field.conditionalRules.length === 0) {
      return true
    }

    for (const rule of field.conditionalRules) {
      const dependentValue = formData[rule.field]
      let conditionMet = false

      switch (rule.operator) {
        case 'equals':
          conditionMet = dependentValue === rule.value
          break
        case 'notEquals':
          conditionMet = dependentValue !== rule.value
          break
        case 'contains':
          conditionMet = typeof dependentValue === 'string' && dependentValue.includes(String(rule.value))
          break
        case 'greaterThan':
          conditionMet = typeof dependentValue === 'number' && dependentValue > Number(rule.value)
          break
        case 'lessThan':
          conditionMet = typeof dependentValue === 'number' && dependentValue < Number(rule.value)
          break
        case 'isEmpty':
          conditionMet = dependentValue === null || dependentValue === undefined || dependentValue === ''
          break
        case 'isNotEmpty':
          conditionMet = dependentValue !== null && dependentValue !== undefined && dependentValue !== ''
          break
      }

      if (rule.action === 'hide' && conditionMet) {
        return false
      }
      if (rule.action === 'show' && !conditionMet) {
        return false
      }
    }

    return true
  }, [formData])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateForm()
    if (!validation.isValid) {
      const flatErrors: Record<string, string> = {}
      for (const [fieldName, fieldErrors] of Object.entries(validation.errors)) {
        flatErrors[fieldName] = fieldErrors[0]
      }
      setErrors(flatErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return

    setIsSavingDraft(true)
    try {
      await onSaveDraft(formData)
    } catch (error) {
      console.error('Save draft error:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Render a section
  const renderSection = (section: FormSection, sectionIndex: number) => {
    const visibleFields = section.fields.filter(isFieldVisible)

    if (visibleFields.length === 0) return null

    return (
      <div key={section.id} className="mb-8">
        {/* Section Header */}
        {section.title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {section.title}
            </h3>
            {section.description && (
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            )}
          </div>
        )}

        {/* Section Fields */}
        <div className="grid grid-cols-4 gap-4">
          {visibleFields.map((field) => {
            const widthClass =
              field.width === 'quarter' ? 'col-span-1' :
              field.width === 'third' ? 'col-span-1' :
              field.width === 'half' ? 'col-span-2' :
              'col-span-4'

            return (
              <div key={field.id} className={widthClass}>
                <FieldRenderer
                  field={field}
                  value={formData[field.name]}
                  onChange={(value) => updateField(field.name, value)}
                  error={errors[field.name]}
                  disabled={readOnly}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form Sections */}
      {schema.sections.map((section, index) => renderSection(section, index))}

      {/* Submit Buttons */}
      {!readOnly && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div>
            {onSaveDraft && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="btn btn-secondary"
              >
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </button>
        </div>
      )}

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {Object.entries(errors).map(([fieldName, error]) => (
              <li key={fieldName}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
