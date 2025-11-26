'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface CheckboxFieldProps {
  field: FormField
  value?: boolean
  onChange?: (value: boolean) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function CheckboxField({
  field,
  value = false,
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: CheckboxFieldProps) {
  const isToggle = field.type === 'toggle'

  if (isToggle) {
    return (
      <FieldWrapper
        field={field}
        error={error}
        isBuilder={isBuilder}
        isSelected={isSelected}
        onClick={onClick}
      >
        <button
          type="button"
          onClick={() => !disabled && !isBuilder && onChange?.(!value)}
          disabled={disabled || isBuilder}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          } ${disabled || isBuilder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              value ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </FieldWrapper>
    )
  }

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled || isBuilder}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="text-sm text-gray-700">
          {field.placeholder || 'Check this option'}
        </span>
      </label>
    </FieldWrapper>
  )
}
