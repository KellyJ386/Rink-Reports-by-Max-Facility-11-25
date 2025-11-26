'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

interface TextAreaFieldProps {
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
  rows?: number
  showCharCount?: boolean
}

export default function TextAreaField({
  id,
  label,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  register,
  value = '',
  onChange,
  helperText,
  maxLength,
  rows = 3,
  showCharCount = false,
}: TextAreaFieldProps) {
  const textareaProps = register
    ? register(id, { required: required ? `${label} is required` : false, maxLength })
    : {
        value,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      }

  const charCount = value?.length ?? 0

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        className={`input resize-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        {...textareaProps}
      />
      <div className="flex justify-between">
        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error.message}</p>
        )}
        {showCharCount && maxLength && (
          <p className={`text-xs ${charCount > maxLength * 0.9 ? 'text-yellow-600' : 'text-gray-400'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
