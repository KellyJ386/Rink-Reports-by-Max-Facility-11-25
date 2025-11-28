'use client'

import { useState, useEffect } from 'react'
import type { FormField, FieldOption } from '@/types/form-builder'

interface FieldConfigPanelProps {
  field: FormField | null
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export default function FieldConfigPanel({ field, onUpdate, onClose }: FieldConfigPanelProps) {
  const [localField, setLocalField] = useState<FormField | null>(field)

  useEffect(() => {
    setLocalField(field)
  }, [field])

  if (!localField) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center py-8">
          Select a field to configure its properties.
        </p>
      </div>
    )
  }

  const handleChange = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    const updated = { ...localField, [key]: value }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleValidationChange = (key: string, value: unknown) => {
    const updated = {
      ...localField,
      validation: {
        ...localField.validation,
        [key]: value,
      },
    }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleAddOption = () => {
    const newOption: FieldOption = {
      label: `Option ${(localField.options?.length || 0) + 1}`,
      value: `option${(localField.options?.length || 0) + 1}`,
    }
    handleChange('options', [...(localField.options || []), newOption])
  }

  const handleUpdateOption = (index: number, key: keyof FieldOption, value: string) => {
    const options = [...(localField.options || [])]
    options[index] = { ...options[index], [key]: value }
    handleChange('options', options)
  }

  const handleDeleteOption = (index: number) => {
    const options = localField.options?.filter((_, i) => i !== index) || []
    handleChange('options', options)
  }

  const hasOptions = ['select', 'multiselect', 'radio'].includes(localField.type)
  const hasMinMax = localField.type === 'number'
  const hasMinMaxLength = ['text', 'textarea', 'email', 'phone'].includes(localField.type)

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Field Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Field Type (read-only) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Field Type
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-700 capitalize">
            {localField.type.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>

        {/* Label */}
        <div>
          <label htmlFor="field-label" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Label
          </label>
          <input
            id="field-label"
            type="text"
            value={localField.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="input text-sm"
          />
        </div>

        {/* Field Name */}
        <div>
          <label htmlFor="field-name" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Field Name (ID)
          </label>
          <input
            id="field-name"
            type="text"
            value={localField.name}
            onChange={(e) => handleChange('name', e.target.value.replace(/\s+/g, '_').toLowerCase())}
            className="input text-sm font-mono"
          />
        </div>

        {/* Placeholder */}
        {!['checkbox', 'radio', 'heading', 'paragraph', 'divider', 'signature', 'photo'].includes(localField.type) && (
          <div>
            <label htmlFor="field-placeholder" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Placeholder
            </label>
            <input
              id="field-placeholder"
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="input text-sm"
            />
          </div>
        )}

        {/* Help Text */}
        <div>
          <label htmlFor="field-help" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Help Text
          </label>
          <input
            id="field-help"
            type="text"
            value={localField.helpText || ''}
            onChange={(e) => handleChange('helpText', e.target.value)}
            className="input text-sm"
          />
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Width
          </label>
          <div className="flex gap-2">
            {(['full', 'half', 'third'] as const).map((width) => (
              <button
                key={width}
                onClick={() => handleChange('width', width)}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                  localField.width === width
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {width === 'full' ? '100%' : width === 'half' ? '50%' : '33%'}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Section */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Validation
          </h4>

          {/* Required */}
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={localField.validation?.required || false}
              onChange={(e) => handleValidationChange('required', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>

          {/* Min/Max for numbers */}
          {hasMinMax && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  type="number"
                  value={localField.validation?.min ?? ''}
                  onChange={(e) => handleValidationChange('min', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  type="number"
                  value={localField.validation?.max ?? ''}
                  onChange={(e) => handleValidationChange('max', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
            </div>
          )}

          {/* Min/Max Length for text */}
          {hasMinMaxLength && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Length</label>
                <input
                  type="number"
                  value={localField.validation?.minLength ?? ''}
                  onChange={(e) => handleValidationChange('minLength', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Length</label>
                <input
                  type="number"
                  value={localField.validation?.maxLength ?? ''}
                  onChange={(e) => handleValidationChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Options Section for select/radio/multiselect */}
        {hasOptions && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Options
              </h4>
              <button
                onClick={handleAddOption}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Add Option
              </button>
            </div>

            <div className="space-y-2">
              {localField.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1 input text-sm"
                  />
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="w-24 input text-sm font-mono"
                  />
                  <button
                    onClick={() => handleDeleteOption(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
