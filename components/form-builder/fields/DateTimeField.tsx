'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface DateTimeFieldProps {
  field: FormField
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function DateTimeField({
  field,
  value = '',
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: DateTimeFieldProps) {
  const inputType = field.type === 'date'
    ? 'date'
    : field.type === 'time'
    ? 'time'
    : 'datetime-local'

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || isBuilder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </FieldWrapper>
  )
}
