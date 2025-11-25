'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TextFieldConfig } from '@/types/forms'

interface TextFieldProps {
  field: TextFieldConfig
  disabled?: boolean
}

export default function TextField({ field, disabled }: TextFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[field.id]

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} required={field.required}>
        {field.label}
      </Label>
      {field.helpText && (
        <p className="text-xs text-wolf-600">{field.helpText}</p>
      )}
      <Input
        id={field.id}
        type="text"
        placeholder={field.placeholder}
        disabled={disabled}
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
