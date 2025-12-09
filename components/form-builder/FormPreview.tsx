'use client'

import { useState, useMemo } from 'react'
import type { FormSchema, FormField } from './types'
import { evaluateConditions } from './ConditionalLogicBuilder'
import { calculateFieldValue } from './CalculatedFieldBuilder'

interface FormPreviewProps {
  schema: FormSchema
  onClose?: () => void
  mode?: 'preview' | 'fullscreen'
}

export function FormPreview({ schema, onClose, mode = 'preview' }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showValidation, setShowValidation] = useState(false)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Get all fields for conditional evaluation
  const allFields = useMemo(
    () => schema.sections.flatMap((s) => s.fields),
    [schema]
  )

  // Evaluate conditions for each field
  const fieldStates = useMemo(() => {
    const states: Record<string, { show: boolean; required: boolean; disabled: boolean }> = {}
    for (const field of allFields) {
      states[field.id] = evaluateConditions(field.conditionalRules || [], values)
    }
    return states
  }, [allFields, values])

  // Calculate calculated fields
  const calculatedValues = useMemo(() => {
    const calculated: Record<string, number | null> = {}
    for (const field of allFields) {
      if (field.type === 'calculated' && field.calculatedConfig) {
        calculated[field.id] = calculateFieldValue(field.calculatedConfig, values)
      }
    }
    return calculated
  }, [allFields, values])

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when value changes
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    for (const field of allFields) {
      const state = fieldStates[field.id]
      if (!state.show) continue

      const isRequired = field.required || state.required
      const value = values[field.id]

      // Required validation
      if (isRequired && isEmpty(value)) {
        newErrors[field.id] = `${field.label} is required`
        continue
      }

      // Skip further validation if empty and not required
      if (isEmpty(value)) continue

      // Type-specific validation
      const validation = field.validation
      if (validation) {
        if (typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            newErrors[field.id] = `Minimum ${validation.minLength} characters required`
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            newErrors[field.id] = `Maximum ${validation.maxLength} characters allowed`
          }
          if (validation.pattern) {
            const regex = new RegExp(validation.pattern)
            if (!regex.test(value)) {
              newErrors[field.id] = validation.patternMessage || 'Invalid format'
            }
          }
        }
        if (typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            newErrors[field.id] = `Minimum value is ${validation.min}`
          }
          if (validation.max !== undefined && value > validation.max) {
            newErrors[field.id] = `Maximum value is ${validation.max}`
          }
        }
      }
    }

    setErrors(newErrors)
    setShowValidation(true)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = validateForm()
    if (isValid) {
      alert('Form is valid! In preview mode, submission is simulated.')
      console.log('Form values:', values)
    }
  }

  const handleReset = () => {
    setValues({})
    setErrors({})
    setShowValidation(false)
  }

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'max-w-2xl',
    mobile: 'max-w-sm',
  }

  return (
    <div className={mode === 'fullscreen' ? 'fixed inset-0 bg-gray-100 z-50 overflow-auto' : ''}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-900">Form Preview</h2>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Preview Mode
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Device preview selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDevicePreview('desktop')}
                className={`p-1.5 rounded ${
                  devicePreview === 'desktop' ? 'bg-white shadow' : ''
                }`}
                title="Desktop"
              >
                <DesktopIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDevicePreview('tablet')}
                className={`p-1.5 rounded ${
                  devicePreview === 'tablet' ? 'bg-white shadow' : ''
                }`}
                title="Tablet"
              >
                <TabletIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDevicePreview('mobile')}
                className={`p-1.5 rounded ${
                  devicePreview === 'mobile' ? 'bg-white shadow' : ''
                }`}
                title="Mobile"
              >
                <MobileIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset Form
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="py-8 px-4">
        <div className={`mx-auto ${deviceWidths[devicePreview]} transition-all duration-300`}>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border">
            {schema.sections.map((section) => (
              <div key={section.id} className="border-b last:border-b-0">
                {/* Section header */}
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h3 className="font-medium text-gray-900">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                  )}
                </div>

                {/* Section fields */}
                <div className="p-6 space-y-6">
                  {section.fields.map((field) => {
                    const state = fieldStates[field.id]
                    if (!state.show) return null

                    const isRequired = field.required || state.required
                    const isDisabled = field.disabled || state.disabled
                    const error = showValidation ? errors[field.id] : undefined

                    return (
                      <PreviewField
                        key={field.id}
                        field={field}
                        value={
                          field.type === 'calculated'
                            ? calculatedValues[field.id]
                            : values[field.id]
                        }
                        onChange={(value) => handleChange(field.id, value)}
                        error={error}
                        required={isRequired}
                        disabled={isDisabled}
                      />
                    )
                  })}

                  {section.fields.length === 0 && (
                    <p className="text-gray-400 text-sm italic">
                      No fields in this section
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Form actions */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
              >
                Clear
              </button>
              <button type="submit" className="btn btn-primary">
                Submit (Preview)
              </button>
            </div>
          </form>

          {/* Debug panel */}
          <details className="mt-4 bg-white rounded-lg shadow-sm border">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700">
              Debug Panel (Form Values)
            </summary>
            <div className="px-4 pb-4">
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify({ values, errors, fieldStates }, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

interface PreviewFieldProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

function PreviewField({
  field,
  value,
  onChange,
  error,
  required,
  disabled,
}: PreviewFieldProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className="input w-full"
          />
        )

      case 'textarea':
        return (
          <textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
            className="input w-full"
          />
        )

      case 'number':
      case 'temperature':
      case 'measurement':
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder={field.placeholder}
              disabled={disabled}
              min={field.validation?.min}
              max={field.validation?.max}
              className="input w-full"
            />
            {field.measurementConfig?.unit && (
              <span className="text-sm text-gray-500">
                {field.measurementConfig.unit}
              </span>
            )}
          </div>
        )

      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input w-full"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.placeholder || 'Yes'}</span>
          </label>
        )

      case 'checkboxGroup':
        const checkedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedValues.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...checkedValues, opt.value])
                    } else {
                      onChange(checkedValues.filter((v) => v !== opt.value))
                    }
                  }}
                  disabled={disabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )

      case 'radioGroup':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  disabled={disabled}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )

      case 'date':
        return (
          <input
            type="date"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input w-full"
          />
        )

      case 'time':
        return (
          <input
            type="time"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input w-full"
          />
        )

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input w-full"
          />
        )

      case 'calculated':
        return (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-lg font-mono">
            {value !== null && value !== undefined ? String(value) : '—'}
          </div>
        )

      case 'signature':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-400">Signature pad (preview)</p>
          </div>
        )

      case 'photo':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-400">Photo upload (preview)</p>
          </div>
        )

      case 'weather':
        return (
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-blue-600">Weather data auto-fetch (preview)</p>
          </div>
        )

      case 'bodyDiagram':
        return (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-400">Body diagram (preview)</p>
          </div>
        )

      case 'iceDepthGrid':
        return (
          <div className="bg-cyan-50 rounded-lg p-8 text-center">
            <p className="text-cyan-600">Ice depth grid (preview)</p>
          </div>
        )

      default:
        return (
          <div className="text-gray-400 text-sm italic">
            Unsupported field type: {field.type}
          </div>
        )
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {field.helpText && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

// Icon components
function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function MobileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}
