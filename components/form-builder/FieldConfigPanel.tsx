'use client'

import { useState } from 'react'
import { FormField, SelectOption, ValidationRule } from '@/types/form-builder'
import { getFieldIcon } from './fields'

interface FieldConfigPanelProps {
  field: FormField | null
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export default function FieldConfigPanel({
  field,
  onUpdate,
  onClose,
}: FieldConfigPanelProps) {
  if (!field) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Field Properties
        </h3>
        <p className="text-sm text-gray-500">
          Select a field to edit its properties
        </p>
      </div>
    )
  }

  const updateField = (updates: Partial<FormField>) => {
    onUpdate({ ...field, ...updates })
  }

  const hasOptions = ['select', 'multiselect', 'radio'].includes(field.type)
  const hasValidation = !['section', 'divider'].includes(field.type)

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded">
            {getFieldIcon(field.type)}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{field.type}</h3>
            <p className="text-xs text-gray-500">Field settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Settings */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Basic
          </h4>

          {/* Label */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Name/ID */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) =>
                updateField({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to identify this field in form data
            </p>
          </div>

          {/* Placeholder */}
          {['text', 'textarea', 'number', 'email', 'phone'].includes(field.type) && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Help Text */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Width */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <select
              value={field.width || 'full'}
              onChange={(e) =>
                updateField({ width: e.target.value as 'full' | 'half' | 'third' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">Third Width</option>
            </select>
          </div>
        </div>

        {/* Options (for select, radio, etc.) */}
        {hasOptions && (
          <OptionsEditor
            options={field.options || []}
            onChange={(options) => updateField({ options })}
          />
        )}

        {/* Validation */}
        {hasValidation && (
          <ValidationEditor
            fieldType={field.type}
            validation={field.validation || []}
            onChange={(validation) => updateField({ validation })}
          />
        )}

        {/* Advanced */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Advanced
          </h4>

          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={field.isLocked || false}
              onChange={(e) => updateField({ isLocked: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Locked (compliance field)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.isHidden || false}
              onChange={(e) => updateField({ isHidden: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Hidden field</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// Options editor for select/radio fields
interface OptionsEditorProps {
  options: SelectOption[]
  onChange: (options: SelectOption[]) => void
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const addOption = () => {
    const newOption: SelectOption = {
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    }
    onChange([...options, newOption])
  }

  const updateOption = (index: number, updates: Partial<SelectOption>) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], ...updates }
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Options
      </h4>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={option.value}
              onChange={(e) =>
                updateOption(index, {
                  value: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                })
              }
              placeholder="Value"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => removeOption(index)}
              className="px-2 text-gray-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
      >
        + Add option
      </button>
    </div>
  )
}

// Validation editor
interface ValidationEditorProps {
  fieldType: string
  validation: ValidationRule[]
  onChange: (validation: ValidationRule[]) => void
}

function ValidationEditor({
  fieldType,
  validation,
  onChange,
}: ValidationEditorProps) {
  const isRequired = validation.some((v) => v.type === 'required')

  const toggleRequired = () => {
    if (isRequired) {
      onChange(validation.filter((v) => v.type !== 'required'))
    } else {
      onChange([...validation, { type: 'required', message: 'This field is required' }])
    }
  }

  const getMinMax = (type: 'min' | 'max') => {
    return validation.find((v) => v.type === type)
  }

  const updateMinMax = (
    type: 'min' | 'max' | 'minLength' | 'maxLength',
    value: string
  ) => {
    const existing = validation.filter((v) => v.type !== type)
    if (value) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        existing.push({
          type,
          value: num,
          message:
            type === 'min'
              ? `Minimum value is ${num}`
              : type === 'max'
              ? `Maximum value is ${num}`
              : type === 'minLength'
              ? `Minimum length is ${num} characters`
              : `Maximum length is ${num} characters`,
        })
      }
    }
    onChange(existing)
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Validation
      </h4>

      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={toggleRequired}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Required</span>
      </label>

      {fieldType === 'number' && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Min</label>
            <input
              type="number"
              value={String(getMinMax('min')?.value ?? '')}
              onChange={(e) => updateMinMax('min', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Max</label>
            <input
              type="number"
              value={String(getMinMax('max')?.value ?? '')}
              onChange={(e) => updateMinMax('max', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {['text', 'textarea'].includes(fieldType) && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Min Length</label>
            <input
              type="number"
              value={String(validation.find((v) => v.type === 'minLength')?.value ?? '')}
              onChange={(e) => updateMinMax('minLength', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Max Length</label>
            <input
              type="number"
              value={String(validation.find((v) => v.type === 'maxLength')?.value ?? '')}
              onChange={(e) => updateMinMax('maxLength', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
