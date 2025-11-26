'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

type FieldType = 'date' | 'time' | 'datetime-local'

interface DateTimeFieldProps {
  id: string
  label: string
  type?: FieldType
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  value?: string
  onChange?: (value: string) => void
  helperText?: string
  min?: string
  max?: string
}

export default function DateTimeField({
  id,
  label,
  type = 'date',
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
}: DateTimeFieldProps) {
  const inputProps = register
    ? register(id, { required: required ? `${label} is required` : false })
    : {
        value: value ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
      }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={id}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
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

// Time-only field
export function TimeField(props: Omit<DateTimeFieldProps, 'type'>) {
  return <DateTimeField {...props} type="time" />
}

// Date-only field
export function DateField(props: Omit<DateTimeFieldProps, 'type'>) {
  return <DateTimeField {...props} type="date" />
}
