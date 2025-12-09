'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

interface Option {
  value: string
  label: string
  description?: string
}

interface RadioFieldProps {
  id: string
  label: string
  options: Option[]
  required?: boolean
  disabled?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  value?: string
  onChange?: (value: string) => void
  layout?: 'vertical' | 'horizontal'
}

export default function RadioField({
  id,
  label,
  options,
  required = false,
  disabled = false,
  error,
  register,
  value,
  onChange,
  layout = 'vertical',
}: RadioFieldProps) {
  const handleChange = (optionValue: string) => {
    onChange?.(optionValue)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="radio"
                id={`${id}-${option.value}`}
                name={id}
                value={option.value}
                disabled={disabled}
                checked={value === option.value}
                onChange={() => handleChange(option.value)}
                className={`h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 ${
                  error ? 'border-red-500' : ''
                }`}
                {...(register ? register(id, { required: required ? `${label} is required` : false }) : {})}
              />
            </div>
            <div className="ml-3">
              <label
                htmlFor={`${id}-${option.value}`}
                className="text-sm text-gray-700"
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-gray-500">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}
