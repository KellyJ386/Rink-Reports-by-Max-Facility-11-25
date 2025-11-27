'use client'

import { useState } from 'react'
import { SelectFieldConfig, FormFieldProps } from '@/types/forms'

interface SelectFieldProps extends FormFieldProps<string | string[]> {
  config: SelectFieldConfig
}

export default function SelectField({
  config,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: SelectFieldProps) {
  const [otherValue, setOtherValue] = useState('')
  const isMulti = config.type === 'multiselect'
  const isRadio = config.type === 'radio'

  // Handle radio button group
  if (isRadio) {
    return (
      <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </legend>
          {config.description && (
            <p className="text-sm text-gray-500 mb-2">{config.description}</p>
          )}
          <div className="space-y-2">
            {config.options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  id={`${config.id}-${option.value}`}
                  name={config.id}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  disabled={disabled || config.disabled}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`${config.id}-${option.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
            {config.allowOther && (
              <div className="flex items-center gap-2">
                <input
                  id={`${config.id}-other`}
                  name={config.id}
                  type="radio"
                  value="other"
                  checked={value === 'other' || !!(value && !config.options.find(o => o.value === value))}
                  onChange={() => onChange(otherValue || 'other')}
                  disabled={disabled || config.disabled}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`${config.id}-other`} className="text-sm text-gray-700">
                  Other:
                </label>
                <input
                  type="text"
                  value={otherValue}
                  onChange={(e) => {
                    setOtherValue(e.target.value)
                    if (value === 'other' || !config.options.find(o => o.value === value)) {
                      onChange(e.target.value)
                    }
                  }}
                  className="input flex-1 py-1"
                  placeholder="Specify..."
                />
              </div>
            )}
          </div>
        </fieldset>
        {error && (
          <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Handle multi-select with checkboxes
  if (isMulti) {
    const selectedValues = Array.isArray(value) ? value : []

    return (
      <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </legend>
          {config.description && (
            <p className="text-sm text-gray-500 mb-2">{config.description}</p>
          )}
          <div className="space-y-2">
            {config.options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  id={`${config.id}-${option.value}`}
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value])
                    } else {
                      onChange(selectedValues.filter(v => v !== option.value))
                    }
                  }}
                  onBlur={onBlur}
                  disabled={disabled || config.disabled}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`${config.id}-${option.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
        {error && (
          <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Standard dropdown select
  return (
    <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.label}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.description && (
        <p className="text-sm text-gray-500 mb-1">{config.description}</p>
      )}
      <select
        id={config.id}
        name={config.id}
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled || config.disabled}
        required={config.required}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${config.id}-error` : undefined}
      >
        <option value="">{config.placeholder || 'Select an option...'}</option>
        {config.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {config.allowOther && <option value="other">Other...</option>}
      </select>
      {config.allowOther && value === 'other' && (
        <input
          type="text"
          value={otherValue}
          onChange={(e) => setOtherValue(e.target.value)}
          className="input mt-2"
          placeholder="Please specify..."
        />
      )}
      {error && (
        <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
