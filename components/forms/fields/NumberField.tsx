'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

interface NumberFieldProps {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  value?: number
  onChange?: (value: number | null) => void
  helperText?: string
  min?: number
  max?: number
  step?: number | 'any'
  unit?: string
}

export default function NumberField({
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
  min,
  max,
  step = 'any',
  unit,
}: NumberFieldProps) {
  const inputProps = register
    ? register(id, {
        required: required ? `${label} is required` : false,
        min: min !== undefined ? { value: min, message: `Minimum value is ${min}` } : undefined,
        max: max !== undefined ? { value: max, message: `Maximum value is ${max}` } : undefined,
        valueAsNumber: true,
      })
    : {
        value: value ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value === '' ? null : parseFloat(e.target.value)
          onChange?.(val)
        },
      }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          className={`input ${unit ? 'pr-12' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          {...inputProps}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {unit}
          </span>
        )}
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}
