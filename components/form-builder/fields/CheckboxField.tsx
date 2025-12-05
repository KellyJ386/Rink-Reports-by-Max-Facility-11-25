'use client'

import { FormField } from '@/types'

interface CheckboxFieldProps {
  field: FormField
  value: boolean | string[]
  onChange: (value: boolean | string[]) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export function CheckboxField({ field, value, onChange, error, disabled, preview }: CheckboxFieldProps) {
  // If options exist, render as checkbox group
  if (field.options && field.options.length > 0) {
    const selectedValues = Array.isArray(value) ? value : []

    const handleCheckboxChange = (optionValue: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedValues, optionValue])
      } else {
        onChange(selectedValues.filter((v) => v !== optionValue))
      }
    }

    return (
      <div className={`field-wrapper ${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {field.options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                disabled={disabled || preview}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        {field.helpText && (
          <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }

  // Single checkbox (boolean)
  return (
    <div className={`field-wrapper ${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled || preview}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500 ml-6">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500 ml-6">{error}</p>
      )}
    </div>
  )
}
