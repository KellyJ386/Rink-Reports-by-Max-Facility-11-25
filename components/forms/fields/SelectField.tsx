'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  label: string
  options: Option[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  value?: string
  onChange?: (value: string) => void
  helperText?: string
}

export default function SelectField({
  id,
  label,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  register,
  value,
  onChange,
  helperText,
}: SelectFieldProps) {
  const selectProps = register
    ? register(id, { required: required ? `${label} is required` : false })
    : {
        value: value ?? '',
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value),
      }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        disabled={disabled}
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        {...selectProps}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}
