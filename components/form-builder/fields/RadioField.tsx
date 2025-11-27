'use client'

import type { FormField } from '@/types/form-builder'

interface RadioFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

export default function RadioField({
  field,
  value = '',
  onChange,
  disabled = false,
  error,
  preview = false,
}: RadioFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.validation?.some(v => v.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="space-y-2">
        {field.options?.map((option) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={field.name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={disabled || preview}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
