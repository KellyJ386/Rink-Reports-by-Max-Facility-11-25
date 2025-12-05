'use client'

import { FormField } from '@/types'

interface TextFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export function TextField({ field, value, onChange, error, disabled, preview }: TextFieldProps) {
  return (
    <div className={`field-wrapper ${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || preview}
        minLength={field.minLength}
        maxLength={field.maxLength}
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
