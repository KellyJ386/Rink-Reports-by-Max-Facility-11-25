'use client'

import { TextAreaFieldConfig, FormFieldProps } from '@/types/forms'

interface TextAreaFieldProps extends FormFieldProps<string> {
  config: TextAreaFieldConfig
}

export default function TextAreaField({
  config,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: TextAreaFieldProps) {
  return (
    <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.label}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.description && (
        <p className="text-sm text-gray-500 mb-1">{config.description}</p>
      )}
      <textarea
        id={config.id}
        name={config.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled || config.disabled}
        placeholder={config.placeholder}
        rows={config.rows || 4}
        maxLength={config.maxLength}
        required={config.required}
        className={`input resize-y ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${config.id}-error` : undefined}
      />
      {config.maxLength && (
        <p className="mt-1 text-xs text-gray-400 text-right">
          {(value || '').length} / {config.maxLength}
        </p>
      )}
      {error && (
        <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
