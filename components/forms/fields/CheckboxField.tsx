'use client'

import { CheckboxFieldConfig, FormFieldProps } from '@/types/forms'

interface CheckboxFieldProps extends FormFieldProps<boolean> {
  config: CheckboxFieldConfig
}

export default function CheckboxField({
  config,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: CheckboxFieldProps) {
  return (
    <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={config.id}
            name={config.id}
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled || config.disabled}
            required={config.required}
            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
              error ? 'border-red-500' : ''
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? `${config.id}-error` : undefined}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={config.id} className="font-medium text-gray-700">
            {config.checkboxLabel || config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {config.description && (
            <p className="text-gray-500">{config.description}</p>
          )}
        </div>
      </div>
      {error && (
        <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
