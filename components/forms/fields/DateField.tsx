'use client'

import { FormField } from '@/types/forms'

interface DateFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export default function DateField({
  field,
  value,
  onChange,
  error,
  disabled,
}: DateFieldProps) {
  const inputType = field.type === 'datetime' ? 'datetime-local' : field.type === 'time' ? 'time' : 'date'

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={field.id}
        name={field.name}
        type={inputType}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        readOnly={field.readOnly}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
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
