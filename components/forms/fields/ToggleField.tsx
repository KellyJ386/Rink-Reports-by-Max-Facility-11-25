'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import type { ToggleFieldConfig } from '@/types/forms'

interface ToggleFieldProps {
  field: ToggleFieldConfig
  disabled?: boolean
}

export default function ToggleField({ field, disabled }: ToggleFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  const error = errors[field.id]

  return (
    <div className="space-y-2">
      {field.helpText && (
        <p className="text-xs text-wolf-600">{field.helpText}</p>
      )}
      <Controller
        name={field.id}
        control={control}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: { onChange, value } }) => (
          <Toggle
            checked={value || false}
            onCheckedChange={onChange}
            label={field.label}
            disabled={disabled}
          />
        )}
      />
      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  )
}
