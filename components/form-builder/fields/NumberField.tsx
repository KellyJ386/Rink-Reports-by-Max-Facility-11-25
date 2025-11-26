'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface NumberFieldProps {
  field: FormField
  value?: number | string
  onChange?: (value: number | undefined) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function NumberField({
  field,
  value = '',
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange?.(undefined)
    } else {
      const num = parseFloat(val)
      if (!isNaN(num)) {
        onChange?.(num)
      }
    }
  }

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={field.placeholder}
        disabled={disabled || isBuilder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </FieldWrapper>
  )
}
