'use client'

import type { FormField } from '@/types/form-builder'

interface TemperatureFieldProps {
  field: FormField
  value: number | string
  onChange: (value: number | string) => void
  error?: string
  disabled?: boolean
}

export default function TemperatureField({
  field,
  value,
  onChange,
  error,
  disabled,
}: TemperatureFieldProps) {
  const unit = field.temperatureUnit || 'F'

  const convertToOther = (val: number, fromUnit: 'F' | 'C'): number => {
    if (fromUnit === 'F') {
      return ((val - 32) * 5) / 9
    }
    return (val * 9) / 5 + 32
  }

  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
  const otherValue = convertToOther(numValue, unit)

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={field.placeholder}
            disabled={disabled}
            step="0.1"
            className={`input pr-10 ${error ? 'border-red-500' : ''}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            °{unit}
          </span>
        </div>

        {value !== '' && !isNaN(numValue) && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            = {otherValue.toFixed(1)}°{unit === 'F' ? 'C' : 'F'}
          </span>
        )}
      </div>

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
