'use client'

import type { FormField } from '@/types/form-builder'

interface TextFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

export default function TextField({
  field,
  value = '',
  onChange,
  disabled = false,
  error,
  preview = false,
}: TextFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.some(v => v.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || preview}
        className={`input w-full ${error ? 'border-red-500' : ''}`}
      />
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
