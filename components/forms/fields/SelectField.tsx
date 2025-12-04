'use client'

import { FormField } from '@/types/forms'

interface SelectFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export default function SelectField({
  field,
  value,
  onChange,
  error,
  disabled,
}: SelectFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={field.id}
        name={field.name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      >
        <option value="">{field.placeholder || 'Select an option'}</option>
        {field.options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
