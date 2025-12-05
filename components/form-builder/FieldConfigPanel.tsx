'use client'

import { useState } from 'react'
import { FormField, SelectOption } from '@/types'

interface FieldConfigPanelProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export function FieldConfigPanel({ field, onUpdate, onClose }: FieldConfigPanelProps) {
  const [localField, setLocalField] = useState<FormField>(field)

  const handleChange = (key: keyof FormField, value: unknown) => {
    const updated = { ...localField, [key]: value }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleOptionChange = (index: number, key: 'label' | 'value', value: string) => {
    const options = [...(localField.options || [])]
    options[index] = { ...options[index], [key]: value }
    handleChange('options', options)
  }

  const addOption = () => {
    const options = [...(localField.options || [])]
    const newIndex = options.length + 1
    options.push({ label: `Option ${newIndex}`, value: `option${newIndex}` })
    handleChange('options', options)
  }

  const removeOption = (index: number) => {
    const options = (localField.options || []).filter((_, i) => i !== index)
    handleChange('options', options)
  }

  const showOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(field.type)
  const showTextValidation = ['text', 'textarea', 'email', 'phone'].includes(field.type)
  const showNumberValidation = field.type === 'number'
  const isLayoutField = ['heading', 'paragraph', 'divider'].includes(field.type)

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Field Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Config form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Field Type (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded capitalize">
            {field.type.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={localField.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="input w-full"
          />
        </div>

        {/* Field Name */}
        {!isLayoutField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <input
              type="text"
              value={localField.name}
              onChange={(e) => handleChange('name', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="input w-full font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Used for data storage (no spaces)</p>
          </div>
        )}

        {/* Placeholder */}
        {!isLayoutField && !['checkbox', 'radio', 'signature', 'file', 'photo'].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="input w-full"
            />
          </div>
        )}

        {/* Help Text */}
        {!isLayoutField && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={localField.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value)}
              className="input w-full"
              placeholder="Additional instructions..."
            />
          </div>
        )}

        {/* Width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width
          </label>
          <select
            value={localField.width || 'full'}
            onChange={(e) => handleChange('width', e.target.value)}
            className="input w-full"
          >
            <option value="full">Full Width</option>
            <option value="half">Half Width</option>
            <option value="third">One Third</option>
            <option value="quarter">Quarter Width</option>
          </select>
        </div>

        {/* Required */}
        {!isLayoutField && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={localField.required || false}
              onChange={(e) => handleChange('required', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="required" className="text-sm font-medium text-gray-700">
              Required field
            </label>
          </div>
        )}

        {/* Compliance flag */}
        {!isLayoutField && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="compliance"
              checked={localField.isCompliance || false}
              onChange={(e) => handleChange('isCompliance', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-amber-600"
            />
            <label htmlFor="compliance" className="text-sm font-medium text-gray-700">
              Compliance field (locked)
            </label>
          </div>
        )}

        {/* Options for select/radio/checkbox */}
        {showOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div className="space-y-2">
              {(localField.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="input flex-1 text-sm"
                  />
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="input w-24 text-sm font-mono"
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Option
            </button>
          </div>
        )}

        {/* Text validation */}
        {showTextValidation && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Validation</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Length</label>
                <input
                  type="number"
                  value={localField.minLength || ''}
                  onChange={(e) => handleChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="input w-full text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                <input
                  type="number"
                  value={localField.maxLength || ''}
                  onChange={(e) => handleChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="input w-full text-sm"
                  min={0}
                />
              </div>
            </div>
          </div>
        )}

        {/* Number validation */}
        {showNumberValidation && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Validation</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min</label>
                <input
                  type="number"
                  value={localField.min ?? ''}
                  onChange={(e) => handleChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max</label>
                <input
                  type="number"
                  value={localField.max ?? ''}
                  onChange={(e) => handleChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Step</label>
                <input
                  type="number"
                  value={localField.step ?? ''}
                  onChange={(e) => handleChange('step', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="input w-full text-sm"
                  step="any"
                />
              </div>
            </div>
          </div>
        )}

        {/* File settings */}
        {(field.type === 'file' || field.type === 'photo') && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">File Settings</h4>
            {field.type === 'file' && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Accept (MIME types)</label>
                <input
                  type="text"
                  value={localField.accept || ''}
                  onChange={(e) => handleChange('accept', e.target.value)}
                  className="input w-full text-sm"
                  placeholder="e.g., .pdf,.doc,.docx"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Size (MB)</label>
              <input
                type="number"
                value={localField.maxSize ? localField.maxSize / 1024 / 1024 : ''}
                onChange={(e) => handleChange('maxSize', e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined)}
                className="input w-full text-sm"
                min={0}
                step={0.5}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          Changes are saved automatically
        </p>
      </div>
    </div>
  )
}
