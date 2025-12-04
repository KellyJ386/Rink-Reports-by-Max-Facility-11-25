'use client'

import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldWrapper, FieldEditWrapper } from './FieldWrapper'

// Render mode
export function SelectFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <select
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        required={field.required}
        className="input w-full"
      >
        <option value="">{field.placeholder || 'Select an option'}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}

// Edit mode
export function SelectFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <select disabled className="input w-full bg-gray-50">
          <option>{field.placeholder || 'Select an option'}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.options && field.options.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            {field.options.length} option{field.options.length !== 1 ? 's' : ''}
          </p>
        )}
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
