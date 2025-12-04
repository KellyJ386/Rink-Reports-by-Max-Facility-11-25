'use client'

import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldWrapper, FieldEditWrapper } from './FieldWrapper'

// Render mode
export function NumberFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        type="number"
        value={value !== undefined && value !== null ? String(value) : ''}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === '' ? null : parseFloat(val))
        }}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        required={field.required}
        min={field.validation?.min}
        max={field.validation?.max}
        step="any"
        className="input w-full"
      />
    </FieldWrapper>
  )
}

// Edit mode
export function NumberFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={field.placeholder || '0'}
            disabled
            className="input w-full bg-gray-50"
          />
          {(field.validation?.min !== undefined || field.validation?.max !== undefined) && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {field.validation?.min !== undefined && `Min: ${field.validation.min}`}
              {field.validation?.min !== undefined && field.validation?.max !== undefined && ' | '}
              {field.validation?.max !== undefined && `Max: ${field.validation.max}`}
            </span>
          )}
        </div>
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
