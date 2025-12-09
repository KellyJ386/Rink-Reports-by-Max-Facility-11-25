'use client'

import { useState } from 'react'

export interface FormField {
  id: string
  type: string
  label: string
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: Array<{ label: string; value: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  isLocked?: boolean
}

interface FieldEditorProps {
  field: FormField
  onChange: (field: FormField) => void
  onDelete: () => void
}

export default function FieldEditor({ field, onChange, onDelete }: FieldEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateField = (updates: Partial<FormField>) => {
    onChange({ ...field, ...updates })
  }

  const addOption = () => {
    const options = field.options || []
    updateField({
      options: [...options, { label: '', value: '' }],
    })
  }

  const updateOption = (index: number, updates: Partial<{ label: string; value: string }>) => {
    const options = [...(field.options || [])]
    options[index] = { ...options[index], ...updates }
    updateField({ options })
  }

  const removeOption = (index: number) => {
    const options = (field.options || []).filter((_, i) => i !== index)
    updateField({ options })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase">
          {field.type} Field
        </span>
        {!field.isLocked && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Label *</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => updateField({ label: e.target.value })}
          disabled={field.isLocked}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
        />
      </div>

      {/* Required Toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`required-${field.id}`}
          checked={field.required || false}
          onChange={(e) => updateField({ required: e.target.checked })}
          disabled={field.isLocked}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor={`required-${field.id}`} className="ml-2 block text-sm text-gray-700">
          Required field
        </label>
      </div>

      {/* Placeholder (for text inputs) */}
      {['text', 'textarea', 'number'].includes(field.type) && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            disabled={field.isLocked}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          />
        </div>
      )}

      {/* Options (for select) */}
      {field.type === 'select' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
          <div className="space-y-2">
            {(field.options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/\s+/g, '_')
                    updateOption(index, { label: e.target.value, value })
                  }}
                  placeholder="Option label"
                  disabled={field.isLocked}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                />
                {!field.isLocked && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {!field.isLocked && (
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add option
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Help Text</label>
        <input
          type="text"
          value={field.helpText || ''}
          onChange={(e) => updateField({ helpText: e.target.value })}
          disabled={field.isLocked}
          placeholder="Additional instructions for users"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
        />
      </div>

      {/* Advanced Options */}
      {field.type === 'number' && (
        <>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Hide' : 'Show'} validation options
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Value</label>
                <input
                  type="number"
                  value={field.validation?.min ?? ''}
                  onChange={(e) =>
                    updateField({
                      validation: {
                        ...field.validation,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  disabled={field.isLocked}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Value</label>
                <input
                  type="number"
                  value={field.validation?.max ?? ''}
                  onChange={(e) =>
                    updateField({
                      validation: {
                        ...field.validation,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  disabled={field.isLocked}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>
          )}
        </>
      )}

      {field.isLocked && (
        <div className="flex items-center gap-2 text-yellow-600 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>This field is locked for compliance</span>
        </div>
      )}
    </div>
  )
}
