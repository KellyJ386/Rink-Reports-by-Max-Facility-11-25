'use client'

import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldWrapper, FieldEditWrapper } from './FieldWrapper'

// Date field - Render mode
export function DateFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        type="date"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        required={field.required}
        className="input w-full"
      />
    </FieldWrapper>
  )
}

// Date field - Edit mode
export function DateFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <input
          type="date"
          disabled
          className="input w-full bg-gray-50"
        />
      </FieldWrapper>
    </FieldEditWrapper>
  )
}

// Time field - Render mode
export function TimeFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        type="time"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        required={field.required}
        className="input w-full"
      />
    </FieldWrapper>
  )
}

// Time field - Edit mode
export function TimeFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <input
          type="time"
          disabled
          className="input w-full bg-gray-50"
        />
      </FieldWrapper>
    </FieldEditWrapper>
  )
}

// DateTime field - Render mode
export function DateTimeFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        type="datetime-local"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        required={field.required}
        className="input w-full"
      />
    </FieldWrapper>
  )
}

// DateTime field - Edit mode
export function DateTimeFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <input
          type="datetime-local"
          disabled
          className="input w-full bg-gray-50"
        />
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
