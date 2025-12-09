'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FormSchema,
  FormField,
  FormSection,
  FormSubmissionData,
  ConditionalRule
} from '@/types/form-builder'

interface FormRendererProps {
  schema: FormSchema
  initialValues?: FormSubmissionData
  onSubmit: (data: FormSubmissionData) => Promise<void>
  onSaveDraft?: (data: FormSubmissionData) => Promise<void>
  readOnly?: boolean
}

interface FieldRendererProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
}

function FieldRenderer({ field, value, onChange, error, disabled }: FieldRendererProps) {
  const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`

  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'half': return 'w-full sm:w-1/2'
      case 'third': return 'w-full sm:w-1/3'
      case 'quarter': return 'w-full sm:w-1/4'
      default: return 'w-full'
    }
  }

  if (field.type === 'divider') {
    return <div className="w-full border-t border-gray-200 my-4" />
  }

  const isDisabled = disabled || field.readOnly

  return (
    <div className={`${getWidthClass(field.width)} p-2`}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'text' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            disabled={isDisabled}
            minLength={field.minLength}
            maxLength={field.maxLength}
          />
        )}

        {field.type === 'number' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              placeholder={field.placeholder}
              className={baseInputClass}
              disabled={isDisabled}
              min={field.min}
              max={field.max}
              step={field.step}
            />
            {field.unit && (
              <span className="text-sm text-gray-500 whitespace-nowrap">{field.unit}</span>
            )}
          </div>
        )}

        {field.type === 'textarea' && (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClass} resize-none`}
            disabled={isDisabled}
            rows={4}
          />
        )}

        {field.type === 'select' && (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={isDisabled}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type === 'checkbox' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
              disabled={isDisabled}
            />
            <span className="text-sm text-gray-700">
              {field.placeholder || field.label}
            </span>
          </label>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={isDisabled}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={isDisabled}
          />
        )}

        {field.type === 'time' && (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={isDisabled}
          />
        )}

        {field.type === 'datetime' && (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={isDisabled}
          />
        )}

        {field.type === 'signature' && (
          <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}>
            {value ? (
              <div>
                <span className="text-green-600">Signature captured</span>
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onChange(`sig_${Date.now()}`)}
                disabled={isDisabled}
                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                Tap to sign
              </button>
            )}
          </div>
        )}

        {field.type === 'calculated' && (
          <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
            <span className="text-xs bg-yellow-200 px-1 rounded mr-2">fx</span>
            {value ?? '—'}
          </div>
        )}

        {field.helpText && (
          <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
        )}

        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}

interface SectionRendererProps {
  section: FormSection
  values: FormSubmissionData
  visibleFields: Set<string>
  onChange: (fieldName: string, value: any) => void
  errors: Record<string, string>
  disabled?: boolean
}

function SectionRenderer({
  section,
  values,
  visibleFields,
  onChange,
  errors,
  disabled
}: SectionRendererProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.collapsed || false)

  const sectionFields = section.fields.filter(f => visibleFields.has(f.id))

  if (sectionFields.length === 0) {
    return null
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h3 className="font-medium text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-gray-500">{section.description}</p>
          )}
        </div>
        <span className="text-gray-400 text-sm">{isCollapsed ? '▼' : '▲'}</span>
      </div>

      {!isCollapsed && (
        <div className="p-4">
          <div className="flex flex-wrap -m-2">
            {sectionFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.name]}
                onChange={(value) => onChange(field.name, value)}
                error={errors[field.name]}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  onSaveDraft,
  readOnly = false
}: FormRendererProps) {
  const [values, setValues] = useState<FormSubmissionData>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Evaluate conditional rules to determine visible fields
  const evaluateCondition = useCallback((rule: ConditionalRule): boolean => {
    const sourceValue = values[rule.sourceFieldId]

    switch (rule.operator) {
      case 'equals':
        return sourceValue === rule.value
      case 'notEquals':
        return sourceValue !== rule.value
      case 'contains':
        return typeof sourceValue === 'string' && sourceValue.includes(String(rule.value))
      case 'greaterThan':
        return typeof sourceValue === 'number' && sourceValue > Number(rule.value)
      case 'lessThan':
        return typeof sourceValue === 'number' && sourceValue < Number(rule.value)
      case 'isEmpty':
        return sourceValue === undefined || sourceValue === null || sourceValue === ''
      case 'isNotEmpty':
        return sourceValue !== undefined && sourceValue !== null && sourceValue !== ''
      default:
        return true
    }
  }, [values])

  // Calculate visible fields based on conditional rules
  const visibleFields = new Set<string>()
  const requiredOverrides = new Map<string, boolean>()

  for (const section of schema.sections) {
    for (const field of section.fields) {
      let isVisible = !field.hidden
      let isRequired = field.required

      if (field.conditionalRules) {
        for (const rule of field.conditionalRules) {
          const conditionMet = evaluateCondition(rule)

          if (rule.action === 'show' && !conditionMet) {
            isVisible = false
          }
          if (rule.action === 'hide' && conditionMet) {
            isVisible = false
          }
          if (rule.action === 'require' && conditionMet) {
            isRequired = true
          }
          if (rule.action === 'unrequire' && conditionMet) {
            isRequired = false
          }
        }
      }

      if (isVisible) {
        visibleFields.add(field.id)
      }
      requiredOverrides.set(field.id, isRequired)
    }
  }

  // Calculate calculated fields
  useEffect(() => {
    if (!schema.settings.autoCalculateOnChange) return

    let hasChanges = false
    const newValues = { ...values }

    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.type === 'calculated' && field.calculatedConfig) {
          const { operation, sourceFields, decimalPlaces = 2 } = field.calculatedConfig
          const sourceValues = sourceFields
            .map(name => values[name])
            .filter(v => typeof v === 'number') as number[]

          let result: number | null = null

          if (sourceValues.length > 0) {
            switch (operation) {
              case 'sum':
                result = sourceValues.reduce((a, b) => a + b, 0)
                break
              case 'average':
                result = sourceValues.reduce((a, b) => a + b, 0) / sourceValues.length
                break
              case 'min':
                result = Math.min(...sourceValues)
                break
              case 'max':
                result = Math.max(...sourceValues)
                break
              case 'count':
                result = sourceValues.length
                break
            }
          }

          const finalValue = result !== null ? Number(result.toFixed(decimalPlaces)) : null

          if (newValues[field.name] !== finalValue) {
            newValues[field.name] = finalValue
            hasChanges = true
          }
        }
      }
    }

    if (hasChanges) {
      setValues(newValues)
    }
  }, [values, schema, schema.settings.autoCalculateOnChange])

  const handleChange = (fieldName: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    for (const section of schema.sections) {
      for (const field of section.fields) {
        // Skip hidden/invisible fields
        if (!visibleFields.has(field.id)) continue

        const value = values[field.name]
        const isRequired = requiredOverrides.get(field.id) ?? field.required

        // Required validation
        if (isRequired) {
          if (value === undefined || value === null || value === '') {
            newErrors[field.name] = 'This field is required'
            continue
          }
        }

        // Skip further validation if empty and not required
        if (value === undefined || value === null || value === '') continue

        // Number validation
        if (field.type === 'number' && typeof value === 'number') {
          if (field.min !== undefined && value < field.min) {
            newErrors[field.name] = `Value must be at least ${field.min}`
          }
          if (field.max !== undefined && value > field.max) {
            newErrors[field.name] = `Value must be at most ${field.max}`
          }
        }

        // Text length validation
        if (field.type === 'text' && typeof value === 'string') {
          if (field.minLength !== undefined && value.length < field.minLength) {
            newErrors[field.name] = `Must be at least ${field.minLength} characters`
          }
          if (field.maxLength !== undefined && value.length > field.maxLength) {
            newErrors[field.name] = `Must be at most ${field.maxLength} characters`
          }
        }
      }
    }

    // Check form-level requirements
    if (schema.settings.requireSignature) {
      const hasSignature = Object.entries(values).some(([key, val]) =>
        key.includes('signature') && val
      )
      if (!hasSignature) {
        newErrors['_form'] = 'Signature is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error('Submission error:', error)
      setErrors({ _form: 'Failed to submit form. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return

    setIsSavingDraft(true)
    try {
      await onSaveDraft(values)
    } catch (error) {
      console.error('Draft save error:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {/* Form Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{schema.title}</h1>
        {schema.description && (
          <p className="text-gray-600 mt-2">{schema.description}</p>
        )}
      </div>

      {/* Form Error */}
      {errors._form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {errors._form}
        </div>
      )}

      {/* Sections */}
      {schema.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          values={values}
          visibleFields={visibleFields}
          onChange={handleChange}
          errors={errors}
          disabled={readOnly}
        />
      ))}

      {/* Actions */}
      {!readOnly && (
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
          <div>
            {schema.settings.allowOfflineSubmission && (
              <span className="text-sm text-gray-500">
                Offline submission supported
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {schema.settings.allowDraft && onSaveDraft && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
