'use client'

import { FormField } from '@/types/forms'

interface CheckboxGroupFieldProps {
  field: FormField
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  disabled?: boolean
}

export default function CheckboxGroupField({
  field,
  value,
  onChange,
  error,
  disabled,
}: CheckboxGroupFieldProps) {
  const currentValue = Array.isArray(value) ? value : []

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...currentValue, optionValue])
    } else {
      onChange(currentValue.filter((v) => v !== optionValue))
    }
  }

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {field.options?.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${field.id}-${option.value}`}
              name={field.name}
              type="checkbox"
              value={option.value}
              checked={currentValue.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={disabled || field.disabled || option.disabled}
              className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                error ? 'border-red-500' : ''
              }`}
            />
            <label
              htmlFor={`${field.id}-${option.value}`}
              className="ml-2 text-sm text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
