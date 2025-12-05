'use client'

import { FormField } from '@/types'

interface NumberFieldProps {
  field: FormField
  value: number | string
  onChange: (value: number | string) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export function NumberField({ field, value, onChange, error, disabled, preview }: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange('')
    } else {
      onChange(parseFloat(val))
    }
  }

  return (
    <div className={`field-wrapper ${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : field.width === 'quarter' ? 'w-1/4' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={field.placeholder}
        disabled={disabled || preview}
        min={field.min}
        max={field.max}
        step={field.step || 'any'}
        className={`input w-full ${error ? 'border-red-500' : ''}`}
      />
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
