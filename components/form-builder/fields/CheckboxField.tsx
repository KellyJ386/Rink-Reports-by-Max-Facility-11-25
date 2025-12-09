'use client'

import type { FormField } from '@/types/form-builder'

interface CheckboxFieldProps {
  field: FormField
  value: boolean
  onChange: (value: boolean) => void
  error?: string
  disabled?: boolean
}

export default function CheckboxField({ field, value, onChange, error, disabled }: CheckboxFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          id={field.id}
          name={field.name}
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={field.validation?.required}
          className={`h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
            error ? 'border-red-500' : ''
          }`}
        />
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {field.helpText && <p className="mt-1 text-xs text-gray-500 ml-8">{field.helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-600 ml-8">{error}</p>}
    </div>
  )
}
