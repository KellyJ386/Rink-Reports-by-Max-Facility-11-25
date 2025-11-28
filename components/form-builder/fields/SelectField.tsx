'use client'

import type { FormField } from '@/types/form-builder'

interface SelectFieldProps {
  field: FormField
  value: string | string[]
  onChange: (value: string | string[]) => void
  error?: string
  disabled?: boolean
}

export default function SelectField({ field, value, onChange, error, disabled }: SelectFieldProps) {
  const isMulti = field.type === 'multiselect'

  if (isMulti) {
    const selectedValues = Array.isArray(value) ? value : []

    const handleMultiChange = (optionValue: string) => {
      if (selectedValues.includes(optionValue)) {
        onChange(selectedValues.filter(v => v !== optionValue))
      } else {
        onChange([...selectedValues, optionValue])
      }
    }

    return (
      <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2 p-3 border border-gray-300 rounded-md">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleMultiChange(option.value)}
                disabled={disabled}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={field.id}
        name={field.name}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={field.validation?.required}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      >
        <option value="">{field.placeholder || 'Select an option...'}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
