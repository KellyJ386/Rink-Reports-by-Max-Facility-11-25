'use client'

import { useState } from 'react'
import { FormSchema, FormField, FormSection, FormSubmissionData } from '@/types/form-builder'

interface FormPreviewProps {
  schema: FormSchema
  onClose?: () => void
}

interface FieldPreviewProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  error?: string
}

function FieldPreview({ field, value, onChange, error }: FieldPreviewProps) {
  const baseInputClass = `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  }`

  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'half': return 'w-1/2'
      case 'third': return 'w-1/3'
      case 'quarter': return 'w-1/4'
      default: return 'w-full'
    }
  }

  if (field.type === 'divider') {
    return <div className="w-full border-t border-gray-200 my-4" />
  }

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
            readOnly={field.readOnly}
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
              readOnly={field.readOnly}
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
            readOnly={field.readOnly}
            rows={4}
          />
        )}

        {field.type === 'select' && (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            disabled={field.readOnly}
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
              disabled={field.readOnly}
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
                  disabled={field.readOnly}
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
            readOnly={field.readOnly}
          />
        )}

        {field.type === 'time' && (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            readOnly={field.readOnly}
          />
        )}

        {field.type === 'datetime' && (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            readOnly={field.readOnly}
          />
        )}

        {field.type === 'signature' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-sm">
              {value ? (
                <div>
                  <span className="text-green-600">Signature captured</span>
                  <button
                    onClick={() => onChange(null)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onChange('signature_placeholder')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Tap to sign
                </button>
              )}
            </div>
          </div>
        )}

        {field.type === 'photo' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-400 text-sm">
              {value ? (
                <div>
                  <span className="text-green-600">Photo added</span>
                  <button
                    onClick={() => onChange(null)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onChange('photo_placeholder')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Add photo
                </button>
              )}
            </div>
          </div>
        )}

        {field.type === 'calculated' && (
          <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-600">
            <span className="text-xs bg-yellow-200 px-1 rounded mr-2">fx</span>
            {value ?? 'Calculated value'}
          </div>
        )}

        {field.helpText && (
          <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
        )}

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}

interface SectionPreviewProps {
  section: FormSection
  values: FormSubmissionData
  onChange: (fieldName: string, value: any) => void
  errors: Record<string, string>
}

function SectionPreview({ section, values, onChange, errors }: SectionPreviewProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.collapsed || false)

  return (
    <div className="mb-6">
      <div
        className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h3 className="font-medium text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-gray-500">{section.description}</p>
          )}
        </div>
        <span className="text-gray-400">{isCollapsed ? '▼' : '▲'}</span>
      </div>

      {!isCollapsed && (
        <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
          <div className="flex flex-wrap -m-2">
            {section.fields.map((field) => (
              <FieldPreview
                key={field.id}
                field={field}
                value={values[field.name]}
                onChange={(value) => onChange(field.name, value)}
                error={errors[field.name]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FormPreview({ schema, onClose }: FormPreviewProps) {
  const [values, setValues] = useState<FormSubmissionData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (fieldName: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    // Clear error when field is edited
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
        const value = values[field.name]

        // Required validation
        if (field.required) {
          if (value === undefined || value === null || value === '') {
            newErrors[field.name] = 'This field is required'
          }
        }

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      alert('Form is valid! (Preview mode - no actual submission)')
      console.log('Form values:', values)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{schema.title}</h2>
            {schema.description && (
              <p className="text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {schema.sections.map((section) => (
            <SectionPreview
              key={section.id}
              section={section}
              values={values}
              onChange={handleChange}
              errors={errors}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Preview Mode</p>
          <div className="flex gap-3">
            {schema.settings.allowDraft && (
              <button
                onClick={() => alert('Draft saved (preview mode)')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Save Draft
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
