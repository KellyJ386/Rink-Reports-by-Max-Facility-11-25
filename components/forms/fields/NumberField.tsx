'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NumberFieldConfig, TemperatureFieldConfig } from '@/types/forms'

interface NumberFieldProps {
  field: NumberFieldConfig | TemperatureFieldConfig
  disabled?: boolean
}

export default function NumberField({ field, disabled }: NumberFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[field.id]

  // Handle temperature field
  const isTemperature = field.type === 'temperature'
  const unit = isTemperature && 'unit' in field ? field.unit || 'F' : null

  // Get step value
  const step =
    'step' in field
      ? field.step
      : 'decimalPlaces' in field && field.decimalPlaces !== undefined
        ? Math.pow(10, -field.decimalPlaces)
        : undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} required={field.required}>
        {field.label}
        {unit && <span className="text-wolf-600 ml-1">(°{unit})</span>}
      </Label>
      {field.helpText && (
        <p className="text-xs text-wolf-600">{field.helpText}</p>
      )}
      <Input
        id={field.id}
        type="number"
        placeholder={field.placeholder}
        disabled={disabled}
        step={step}
        {...register(field.id, {
          required: field.required ? `${field.label} is required` : false,
          min:
            field.min !== undefined
              ? {
                  value: field.min,
                  message: `Minimum value is ${field.min}`,
                }
              : undefined,
          max:
            field.max !== undefined
              ? {
                  value: field.max,
                  message: `Maximum value is ${field.max}`,
                }
              : undefined,
          valueAsNumber: true,
        })}
      />
      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  )
}
