'use client'

import { NumberFieldConfig, FormFieldProps } from '@/types/forms'

interface NumberFieldProps extends FormFieldProps<number | null> {
  config: NumberFieldConfig
}

export default function NumberField({
  config,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: NumberFieldProps) {
  return (
    <div className={`form-field ${config.width === 'half' ? 'w-1/2' : config.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.label}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {config.description && (
        <p className="text-sm text-gray-500 mb-1">{config.description}</p>
      )}
      <div className="relative">
        <input
          id={config.id}
          name={config.id}
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onChange(val === '' ? null : parseFloat(val))
          }}
          onBlur={onBlur}
          disabled={disabled || config.disabled}
          placeholder={config.placeholder}
          min={config.min}
          max={config.max}
          step={config.step || 'any'}
          required={config.required}
          className={`input ${config.unit ? 'pr-12' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${config.id}-error` : undefined}
        />
        {config.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {config.unit}
          </span>
        )}
      </div>
      {error && (
        <p id={`${config.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
