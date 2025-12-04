'use client'

import type { FieldEditProps, FieldRenderProps } from '../types'
import { FieldEditWrapper } from './FieldWrapper'

// Single checkbox - Render mode
export function CheckboxFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <div className="mb-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled || field.disabled}
          required={field.required}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </span>
          {field.helpText && (
            <p className="text-sm text-gray-500">{field.helpText}</p>
          )}
        </div>
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Single checkbox - Edit mode
export function CheckboxFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          disabled
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />
        <div>
          <span className="text-sm font-medium text-gray-700">{field.label}</span>
          {field.helpText && (
            <p className="text-sm text-gray-500">{field.helpText}</p>
          )}
        </div>
      </label>
    </FieldEditWrapper>
  )
}

// Checkbox group - Render mode
export function CheckboxGroupFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  const selectedValues = (value as string[]) || []

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, optionValue])
    } else {
      onChange(selectedValues.filter((v) => v !== optionValue))
    }
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {field.options?.map((option) => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={disabled || field.disabled}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Checkbox group - Edit mode
export function CheckboxGroupFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {field.options?.slice(0, 3).map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
          {field.options && field.options.length > 3 && (
            <p className="text-xs text-gray-500 ml-7">
              +{field.options.length - 3} more options
            </p>
          )}
        </div>
      </div>
    </FieldEditWrapper>
  )
}

// Radio group - Render mode
export function RadioGroupFieldRender({ field, value, onChange, error, disabled }: FieldRenderProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {field.options?.map((option) => (
          <label key={option.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled || field.disabled}
              required={field.required}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Radio group - Edit mode
export function RadioGroupFieldEdit({ field, isSelected, onSelect, onDelete }: FieldEditProps) {
  return (
    <FieldEditWrapper
      field={field}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {field.options?.slice(0, 3).map((option) => (
            <label key={option.value} className="flex items-center gap-3">
              <input
                type="radio"
                disabled
                className="h-4 w-4 border-gray-300"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
          {field.options && field.options.length > 3 && (
            <p className="text-xs text-gray-500 ml-7">
              +{field.options.length - 3} more options
            </p>
          )}
        </div>
      </div>
    </FieldEditWrapper>
  )
}
