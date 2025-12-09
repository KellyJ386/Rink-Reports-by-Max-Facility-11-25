'use client'

import type { FormField } from '@/types/form-builder'

interface NumberFieldProps {
  field: FormField
  value: number | string
  onChange: (value: number | string) => void
  error?: string
  disabled?: boolean
}

export default function NumberField({ field, value, onChange, error, disabled }: NumberFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="number"
        id={field.id}
        name={field.name}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={field.placeholder}
        disabled={disabled}
        required={field.validation?.required}
        min={field.validation?.min}
        max={field.validation?.max}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
