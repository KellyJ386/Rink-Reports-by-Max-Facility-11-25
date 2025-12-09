'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import type { DropdownFieldConfig } from '@/types/forms'
import { cn } from '@/lib/utils'

interface DropdownFieldProps {
  field: DropdownFieldConfig
  disabled?: boolean
}

export default function DropdownField({ field, disabled }: DropdownFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[field.id]

  // Normalize options to {label, value} format
  const options = field.options.map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option }
    }
    return option
  })

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} required={field.required}>
        {field.label}
      </Label>
      {field.helpText && (
        <p className="text-xs text-wolf-600">{field.helpText}</p>
      )}
      <select
        id={field.id}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-lg border border-wolf-300 bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          error && 'border-red-500 focus:ring-red-500'
        )}
        {...register(field.id, {
          required: field.required ? `${field.label} is required` : false,
        })}
      >
        <option value="">
          {field.placeholder || `Select ${field.label}...`}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  )
}
