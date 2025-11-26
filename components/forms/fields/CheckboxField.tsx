'use client'

import { UseFormRegister, FieldError } from 'react-hook-form'

interface CheckboxFieldProps {
  id: string
  label: string
  description?: string
  required?: boolean
  disabled?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  checked?: boolean
  onChange?: (checked: boolean) => void
}

export default function CheckboxField({
  id,
  label,
  description,
  required = false,
  disabled = false,
  error,
  register,
  checked,
  onChange,
}: CheckboxFieldProps) {
  const checkboxProps = register
    ? register(id, { required: required ? `${label} is required` : false })
    : {
        checked: checked ?? false,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked),
      }

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={id}
            disabled={disabled}
            className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
              error ? 'border-red-500' : ''
            }`}
            {...checkboxProps}
          />
        </div>
        <div className="ml-3">
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 ml-7">{error.message}</p>
      )}
    </div>
  )
}

// Checkbox group for multiple checkboxes
interface CheckboxGroupProps {
  id: string
  label: string
  options: { value: string; label: string }[]
  required?: boolean
  error?: FieldError
  register?: UseFormRegister<any>
  values?: string[]
  onChange?: (values: string[]) => void
}

export function CheckboxGroup({
  id,
  label,
  options,
  required = false,
  error,
  register,
  values = [],
  onChange,
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (onChange) {
      if (checked) {
        onChange([...values, optionValue])
      } else {
        onChange(values.filter((v) => v !== optionValue))
      }
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="checkbox"
              id={`${id}-${option.value}`}
              checked={values.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              {...(register ? register(`${id}.${option.value}`) : {})}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              className="ml-3 text-sm text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}
