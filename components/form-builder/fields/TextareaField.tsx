'use client'

import type { FormField } from '@/types/form-builder'

interface TextareaFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

export default function TextareaField({
  field,
  value = '',
  onChange,
  disabled = false,
  error,
  preview = false,
}: TextareaFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.some(v => v.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || preview}
        rows={4}
        className={`input w-full resize-y ${error ? 'border-red-500' : ''}`}
      />
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
