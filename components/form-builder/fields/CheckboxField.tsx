'use client'

import type { FormField } from '@/types/form-builder'

interface CheckboxFieldProps {
  field: FormField
  value?: boolean
  onChange?: (value: boolean) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

export default function CheckboxField({
  field,
  value = false,
  onChange,
  disabled = false,
  error,
  preview = false,
}: CheckboxFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled || preview}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.validation?.some(v => v.type === 'required') && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </span>
      </label>
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500 ml-6">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500 ml-6">{error}</p>}
    </div>
  )
}
