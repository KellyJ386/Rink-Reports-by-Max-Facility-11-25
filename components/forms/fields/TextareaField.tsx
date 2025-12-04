'use client'

import { FormField } from '@/types/forms'

interface TextareaFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export default function TextareaField({
  field,
  value,
  onChange,
  error,
  disabled,
}: TextareaFieldProps) {
  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={field.id}
        name={field.name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        readOnly={field.readOnly}
        rows={field.rows || 4}
        maxLength={field.validation?.maxLength}
        className={`input resize-y ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
