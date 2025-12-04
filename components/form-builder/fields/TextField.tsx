'use client'

import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldWrapper, FieldEditWrapper } from './FieldWrapper'

// Render mode - for form submission
export function TextFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  const inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'

  return (
    <FieldWrapper field={field} error={error}>
      <input
        type={inputType}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        required={field.required}
        minLength={field.validation?.minLength}
        maxLength={field.validation?.maxLength}
        pattern={field.validation?.pattern}
        className="input w-full"
      />
    </FieldWrapper>
  )
}

// Edit mode - for form builder preview
export function TextFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <input
          type="text"
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          disabled
          className="input w-full bg-gray-50"
        />
      </FieldWrapper>
    </FieldEditWrapper>
  )
}

// Textarea variants
export function TextareaFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <FieldWrapper field={field} error={error}>
      <textarea
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        required={field.required}
        minLength={field.validation?.minLength}
        maxLength={field.validation?.maxLength}
        rows={4}
        className="input w-full resize-y min-h-[100px]"
      />
    </FieldWrapper>
  )
}

export function TextareaFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <FieldWrapper field={field}>
        <textarea
          placeholder={field.placeholder || 'Enter text...'}
          disabled
          rows={3}
          className="input w-full bg-gray-50 resize-none"
        />
      </FieldWrapper>
    </FieldEditWrapper>
  )
}
