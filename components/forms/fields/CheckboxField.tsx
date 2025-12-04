'use client'

import { FormField } from '@/types/forms'

interface CheckboxFieldProps {
  field: FormField
  value: boolean
  onChange: (value: boolean) => void
  error?: string
  disabled?: boolean
}

export default function CheckboxField({
  field,
  value,
  onChange,
  error,
  disabled,
}: CheckboxFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={field.id}
            name={field.name}
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled || field.disabled}
            className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
              error ? 'border-red-500' : ''
            }`}
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor={field.id}
            className="text-sm font-medium text-gray-700"
          >
            {field.label}
            {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.helpText && (
            <p className="text-xs text-gray-500">{field.helpText}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
