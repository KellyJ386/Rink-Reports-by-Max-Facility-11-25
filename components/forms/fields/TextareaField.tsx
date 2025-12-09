'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import type { TextareaFieldConfig } from '@/types/forms'
import { cn } from '@/lib/utils'

interface TextareaFieldProps {
  field: TextareaFieldConfig
  disabled?: boolean
}

export default function TextareaField({ field, disabled }: TextareaFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[field.id]

  return (
    <div className="space-y-2 col-span-full">
      <Label htmlFor={field.id} required={field.required}>
        {field.label}
      </Label>
      {field.helpText && (
        <p className="text-xs text-wolf-600">{field.helpText}</p>
      )}
      <textarea
        id={field.id}
        rows={field.rows || 4}
        placeholder={field.placeholder}
        disabled={disabled}
        className={cn(
          'flex w-full rounded-lg border border-wolf-300 bg-white px-3 py-2 text-sm text-navy placeholder:text-wolf-400 focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          error && 'border-red-500 focus:ring-red-500'
        )}
        {...register(field.id, {
          required: field.required ? `${field.label} is required` : false,
          maxLength: field.maxLength
            ? {
                value: field.maxLength,
                message: `Maximum ${field.maxLength} characters`,
              }
            : undefined,
          minLength: field.minLength
            ? {
                value: field.minLength,
                message: `Minimum ${field.minLength} characters`,
              }
            : undefined,
        })}
      />
      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  )
}
