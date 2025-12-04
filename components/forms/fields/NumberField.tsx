'use client'

import { FormField } from '@/types/forms'

interface NumberFieldProps {
  field: FormField
  value: number | string
  onChange: (value: number | string) => void
  error?: string
  disabled?: boolean
}

export default function NumberField({
  field,
  value,
  onChange,
  error,
  disabled,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange('')
    } else {
      const num = field.type === 'decimal' ? parseFloat(val) : parseInt(val, 10)
      onChange(isNaN(num) ? val : num)
    }
  }

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : field.width === 'quarter' ? 'w-1/4' : 'w-full'}`}>
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {field.label}
        {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
        {field.unit && <span className="text-gray-400 ml-1">({field.unit})</span>}
      </label>
      <input
        id={field.id}
        name={field.name}
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        readOnly={field.readOnly}
        min={field.validation?.min}
        max={field.validation?.max}
        step={field.step || (field.type === 'decimal' ? 0.01 : 1)}
        className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      />
      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
