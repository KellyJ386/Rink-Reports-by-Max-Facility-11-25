'use client'

import type { FormField, FieldOption, ValidationRule } from '@/types/form-builder'
import ConditionalLogicEditor from './ConditionalLogicEditor'
import CalculatedFieldEditor from './CalculatedFieldEditor'

interface FieldConfigPanelProps {
  field: FormField | null
  allFields?: FormField[]
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export default function FieldConfigPanel({
  field,
  allFields = [],
  onUpdate,
  onClose,
}: FieldConfigPanelProps) {
  if (!field) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">⚙️</div>
          <p>Select a field to configure</p>
        </div>
      </div>
    )
  }

  const updateField = (updates: Partial<FormField>) => {
    onUpdate({ ...field, ...updates })
  }

  const hasOptions = field.type === 'select' || field.type === 'radio'
  const canBeRequired = !['section', 'divider'].includes(field.type)

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Field Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Field Type Badge */}
        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium inline-block">
          {field.type.toUpperCase()}
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            className="input w-full"
            disabled={field.isLocked}
          />
        </div>

        {/* Placeholder (for input fields) */}
        {['text', 'number', 'email', 'phone', 'textarea', 'select'].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateField({ placeholder: e.target.value })}
              className="input w-full"
              disabled={field.isLocked}
            />
          </div>
        )}

        {/* Help Text */}
        {!['divider'].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value })}
              className="input w-full"
              placeholder="Optional instructions for this field"
            />
          </div>
        )}

        {/* Width */}
        {!['section', 'divider'].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <select
              value={field.width || 'full'}
              onChange={(e) => updateField({ width: e.target.value as 'full' | 'half' | 'third' })}
              className="input w-full"
              disabled={field.isLocked}
            >
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">One Third</option>
            </select>
          </div>
        )}

        {/* Required Checkbox */}
        {canBeRequired && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.validation?.some((v) => v.type === 'required') || false}
                onChange={(e) => {
                  const currentValidation = field.validation || []
                  if (e.target.checked) {
                    updateField({
                      validation: [
                        ...currentValidation,
                        { type: 'required', message: 'This field is required' },
                      ],
                    })
                  } else {
                    updateField({
                      validation: currentValidation.filter((v) => v.type !== 'required'),
                    })
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                disabled={field.isLocked}
              />
              <span className="text-sm font-medium text-gray-700">Required</span>
            </label>
          </div>
        )}

        {/* Options (for select/radio) */}
        {hasOptions && (
          <OptionsEditor
            options={field.options || []}
            onChange={(options) => updateField({ options })}
            disabled={field.isLocked}
          />
        )}

        {/* Number validation */}
        {field.type === 'number' && (
          <NumberValidation
            validation={field.validation || []}
            onChange={(validation) => updateField({ validation })}
            disabled={field.isLocked}
          />
        )}

        {/* Text validation */}
        {['text', 'textarea', 'email', 'phone'].includes(field.type) && (
          <TextValidation
            validation={field.validation || []}
            onChange={(validation) => updateField({ validation })}
            disabled={field.isLocked}
          />
        )}

        {/* Conditional Logic */}
        <ConditionalLogicEditor
          field={field}
          allFields={allFields}
          onUpdate={(rules) => updateField({ conditionalRules: rules })}
          disabled={field.isLocked}
        />

        {/* Calculated Fields */}
        <CalculatedFieldEditor
          field={field}
          allFields={allFields}
          onUpdate={(config) => updateField({ defaultValue: config as unknown as string })}
          disabled={field.isLocked}
        />

        {/* Lock indicator */}
        {field.isLocked && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              🔒 This field is locked for compliance and cannot be modified.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Options editor component
function OptionsEditor({
  options,
  onChange,
  disabled,
}: {
  options: FieldOption[]
  onChange: (options: FieldOption[]) => void
  disabled?: boolean
}) {
  const addOption = () => {
    onChange([
      ...options,
      { label: `Option ${options.length + 1}`, value: `option${options.length + 1}` },
    ])
  }

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], ...updates }
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Options
      </label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="input flex-1 text-sm"
              placeholder="Label"
              disabled={disabled}
            />
            <button
              onClick={() => removeOption(index)}
              className="px-2 text-red-500 hover:text-red-700"
              disabled={disabled}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        disabled={disabled}
      >
        + Add Option
      </button>
    </div>
  )
}

// Number validation component
function NumberValidation({
  validation,
  onChange,
  disabled,
}: {
  validation: ValidationRule[]
  onChange: (validation: ValidationRule[]) => void
  disabled?: boolean
}) {
  const minRule = validation.find((v) => v.type === 'min')
  const maxRule = validation.find((v) => v.type === 'max')

  const updateRule = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number(value)
    const newValidation = validation.filter((v) => v.type !== type)

    if (numValue !== undefined) {
      newValidation.push({
        type,
        value: numValue,
        message: type === 'min' ? `Minimum value is ${numValue}` : `Maximum value is ${numValue}`,
      })
    }

    onChange(newValidation)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Min</label>
          <input
            type="number"
            value={minRule?.value ?? ''}
            onChange={(e) => updateRule('min', e.target.value)}
            className="input w-full text-sm"
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Max</label>
          <input
            type="number"
            value={maxRule?.value ?? ''}
            onChange={(e) => updateRule('max', e.target.value)}
            className="input w-full text-sm"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

// Text validation component
function TextValidation({
  validation,
  onChange,
  disabled,
}: {
  validation: ValidationRule[]
  onChange: (validation: ValidationRule[]) => void
  disabled?: boolean
}) {
  const minLengthRule = validation.find((v) => v.type === 'minLength')
  const maxLengthRule = validation.find((v) => v.type === 'maxLength')

  const updateRule = (type: 'minLength' | 'maxLength', value: string) => {
    const numValue = value === '' ? undefined : Number(value)
    const newValidation = validation.filter((v) => v.type !== type)

    if (numValue !== undefined) {
      newValidation.push({
        type,
        value: numValue,
        message: type === 'minLength' ? `Minimum ${numValue} characters` : `Maximum ${numValue} characters`,
      })
    }

    onChange(newValidation)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Min Length</label>
          <input
            type="number"
            value={minLengthRule?.value ?? ''}
            onChange={(e) => updateRule('minLength', e.target.value)}
            className="input w-full text-sm"
            min={0}
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Max Length</label>
          <input
            type="number"
            value={maxLengthRule?.value ?? ''}
            onChange={(e) => updateRule('maxLength', e.target.value)}
            className="input w-full text-sm"
            min={0}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
