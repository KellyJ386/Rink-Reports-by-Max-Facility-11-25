'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface TextFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function TextField({
  field,
  value = '',
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: TextFieldProps) {
  const isTextarea = field.type === 'textarea'

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled || isBuilder}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        />
      ) : (
        <input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled || isBuilder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      )}
    </FieldWrapper>
  )
}
