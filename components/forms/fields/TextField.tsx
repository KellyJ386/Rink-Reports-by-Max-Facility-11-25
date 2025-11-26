'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

interface TextFieldProps {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  value?: string
  onChange?: (value: string) => void
  helperText?: string
  maxLength?: number
}

export default function TextField({
  id,
  label,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  register,
  value,
  onChange,
  helperText,
  maxLength,
}: TextFieldProps) {
  const inputProps = register
    ? register(id, { required: required ? `${label} is required` : false, maxLength })
    : {
        value,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
      }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        {...inputProps}
      />
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}
