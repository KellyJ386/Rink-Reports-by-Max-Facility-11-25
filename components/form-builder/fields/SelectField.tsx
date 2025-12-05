'use client'

import { FormField } from '@/types'

interface SelectFieldProps {
  field: FormField
  value: string | string[]
  onChange: (value: string | string[]) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export function SelectField({ field, value, onChange, error, disabled, preview }: SelectFieldProps) {
  const isMulti = field.type === 'multiselect'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isMulti) {
      const selected = Array.from(e.target.selectedOptions, (option) => option.value)
      onChange(selected)
    } else {
      onChange(e.target.value)
    }
  }

  return (
    <div className={`field-wrapper ${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={isMulti ? (Array.isArray(value) ? value : []) : (value as string) || ''}
        onChange={handleChange}
        disabled={disabled || preview}
        multiple={isMulti}
        className={`input w-full ${error ? 'border-red-500' : ''} ${isMulti ? 'min-h-[120px]' : ''}`}
      >
        {!isMulti && <option value="">Select...</option>}
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
