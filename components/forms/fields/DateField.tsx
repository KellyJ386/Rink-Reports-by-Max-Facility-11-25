'use client'

import { DateFieldConfig, FormFieldProps } from '@/types/forms'

interface DateFieldProps extends FormFieldProps<string> {
  config: DateFieldConfig
}

export default function DateField({
  config,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: DateFieldProps) {
  const inputType = config.type === 'time' ? 'time' : config.type === 'datetime' ? 'datetime-local' : 'date'

  return (
    <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.label}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.description && (
        <p className="text-sm text-gray-500 mb-1">{config.description}</p>
      )}
      <input
        id={config.id}
        name={config.id}
        type={inputType}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled || config.disabled}
        min={config.minDate}
        max={config.maxDate}
        required={config.required}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${config.id}-error` : undefined}
      />
      {error && (
        <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
