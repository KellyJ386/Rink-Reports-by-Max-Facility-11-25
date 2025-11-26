'use client'

import { FormField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface SelectFieldProps {
  field: FormField
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function SelectField({
  field,
  value = field.type === 'multiselect' ? [] : '',
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: SelectFieldProps) {
  const isMulti = field.type === 'multiselect'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isMulti) {
      const selected = Array.from(e.target.selectedOptions, (option) => option.value)
      onChange?.(selected)
    } else {
      onChange?.(e.target.value)
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
      <select
        value={value as string}
        onChange={handleChange}
        disabled={disabled || isBuilder}
        multiple={isMulti}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          isMulti ? 'min-h-[100px]' : ''
        }`}
      >
        {!isMulti && <option value="">Select an option...</option>}
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
