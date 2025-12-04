'use client'

import { useState } from 'react'
import { FormField, FieldOption } from '@/types/forms'

interface FieldEditorProps {
  field: FormField
  sectionId: string
  onUpdate: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void
  onClose: () => void
}

export default function FieldEditor({
  field,
  sectionId,
  onUpdate,
  onClose,
}: FieldEditorProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'validation' | 'options'>('general')

  const update = (updates: Partial<FormField>) => {
    onUpdate(sectionId, field.id, updates)
  }

  const hasOptions = ['select', 'radio', 'checkboxGroup', 'multiselect'].includes(field.type)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Edit Field</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'general'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'validation'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Validation
        </button>
        {hasOptions && (
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'options'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Options
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'general' && (
          <GeneralTab field={field} onUpdate={update} />
        )}
        {activeTab === 'validation' && (
          <ValidationTab field={field} onUpdate={update} />
        )}
        {activeTab === 'options' && hasOptions && (
          <OptionsTab field={field} onUpdate={update} />
        )}
      </div>
    </div>
  )
}

// General Settings Tab
function GeneralTab({
  field,
  onUpdate,
}: {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}) {
  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Label
        </label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="input"
        />
      </div>

      {/* Field Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Name
        </label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => onUpdate({ name: e.target.value.replace(/\s/g, '_') })}
          className="input font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Used for data storage (no spaces)
        </p>
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder
        </label>
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="input"
        />
      </div>

      {/* Help Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Help Text
        </label>
        <textarea
          value={field.helpText || ''}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          rows={2}
          className="input"
        />
      </div>

      {/* Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Width
        </label>
        <select
          value={field.width || 'full'}
          onChange={(e) => onUpdate({ width: e.target.value as any })}
          className="input"
        >
          <option value="full">Full Width</option>
          <option value="half">Half Width</option>
          <option value="third">Third Width</option>
          <option value="quarter">Quarter Width</option>
        </select>
      </div>

      {/* Unit (for number/measurement fields) */}
      {['number', 'decimal', 'temperature', 'measurement'].includes(field.type) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <input
            type="text"
            value={field.unit || ''}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            placeholder="e.g., inches, ppm, °F"
            className="input"
          />
        </div>
      )}

      {/* Rows (for textarea) */}
      {field.type === 'textarea' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rows
          </label>
          <input
            type="number"
            value={field.rows || 4}
            onChange={(e) => onUpdate({ rows: parseInt(e.target.value) || 4 })}
            min={2}
            max={20}
            className="input"
          />
        </div>
      )}

      {/* Read Only */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="readOnly"
          checked={field.readOnly || false}
          onChange={(e) => onUpdate({ readOnly: e.target.checked })}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="readOnly" className="ml-2 text-sm text-gray-700">
          Read Only
        </label>
      </div>
    </div>
  )
}

// Validation Settings Tab
function ValidationTab({
  field,
  onUpdate,
}: {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}) {
  const validation = field.validation || {}

  const updateValidation = (updates: Partial<typeof validation>) => {
    onUpdate({ validation: { ...validation, ...updates } })
  }

  return (
    <div className="space-y-4">
      {/* Required */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="required"
          checked={validation.required || false}
          onChange={(e) => updateValidation({ required: e.target.checked })}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="required" className="ml-2 text-sm text-gray-700">
          Required
        </label>
      </div>

      {/* Custom Required Message */}
      {validation.required && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Message
          </label>
          <input
            type="text"
            value={validation.customMessage || ''}
            onChange={(e) => updateValidation({ customMessage: e.target.value })}
            placeholder="This field is required"
            className="input"
          />
        </div>
      )}

      {/* Min/Max for numbers */}
      {['number', 'decimal', 'temperature', 'measurement'].includes(field.type) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum
              </label>
              <input
                type="number"
                value={validation.min ?? ''}
                onChange={(e) =>
                  updateValidation({
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum
              </label>
              <input
                type="number"
                value={validation.max ?? ''}
                onChange={(e) =>
                  updateValidation({
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="input"
              />
            </div>
          </div>
        </>
      )}

      {/* Min/Max Length for text */}
      {['text', 'textarea'].includes(field.type) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Length
            </label>
            <input
              type="number"
              value={validation.minLength ?? ''}
              onChange={(e) =>
                updateValidation({
                  minLength: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              min={0}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Length
            </label>
            <input
              type="number"
              value={validation.maxLength ?? ''}
              onChange={(e) =>
                updateValidation({
                  maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              min={1}
              className="input"
            />
          </div>
        </div>
      )}

      {/* Pattern for text */}
      {field.type === 'text' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pattern (Regex)
            </label>
            <input
              type="text"
              value={validation.pattern || ''}
              onChange={(e) => updateValidation({ pattern: e.target.value })}
              placeholder="e.g., ^[A-Z]{2,}$"
              className="input font-mono text-sm"
            />
          </div>
          {validation.pattern && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pattern Error Message
              </label>
              <input
                type="text"
                value={validation.patternMessage || ''}
                onChange={(e) => updateValidation({ patternMessage: e.target.value })}
                placeholder="Invalid format"
                className="input"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Options Tab (for select, radio, checkbox groups)
function OptionsTab({
  field,
  onUpdate,
}: {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
}) {
  const options = field.options || []

  const addOption = () => {
    const newOption: FieldOption = {
      label: `Option ${options.length + 1}`,
      value: `option${options.length + 1}`,
    }
    onUpdate({ options: [...options, newOption] })
  }

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = options.map((opt, i) =>
      i === index ? { ...opt, ...updates } : opt
    )
    onUpdate({ options: newOptions })
  }

  const removeOption = (index: number) => {
    onUpdate({ options: options.filter((_, i) => i !== index) })
  }

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= options.length) return

    const newOptions = [...options]
    const temp = newOptions[index]
    newOptions[index] = newOptions[newIndex]
    newOptions[newIndex] = temp
    onUpdate({ options: newOptions })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Options</h4>
        <button
          onClick={addOption}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add Option
        </button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
          >
            {/* Move Buttons */}
            <div className="flex flex-col">
              <button
                onClick={() => moveOption(index, 'up')}
                disabled={index === 0}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                onClick={() => moveOption(index, 'down')}
                disabled={index === options.length - 1}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                ▼
              </button>
            </div>

            {/* Label & Value */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                placeholder="Label"
                className="input text-sm"
              />
              <input
                type="text"
                value={option.value}
                onChange={(e) =>
                  updateOption(index, { value: e.target.value.replace(/\s/g, '_') })
                }
                placeholder="Value"
                className="input text-sm font-mono"
              />
            </div>

            {/* Delete */}
            <button
              onClick={() => removeOption(index)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {options.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No options yet. Click "Add Option" to create one.
        </p>
      )}
    </div>
  )
}
