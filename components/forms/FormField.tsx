'use client'

import { FieldConfig } from '@/types/forms'
import TextField from './fields/TextField'
import NumberField from './fields/NumberField'
import TextAreaField from './fields/TextAreaField'
import CheckboxField from './fields/CheckboxField'
import SelectField from './fields/SelectField'
import DateField from './fields/DateField'
import SectionField from './fields/SectionField'

interface FormFieldRendererProps {
  config: FieldConfig
  value: unknown
  onChange: (value: unknown) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  children?: React.ReactNode // For section fields
}

/**
 * FormField - Universal field renderer
 * Automatically renders the correct field component based on config.type
 */
export default function FormField({
  config,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  children,
}: FormFieldRendererProps) {
  // Hide field if conditionally hidden
  if (config.hidden) {
    return null
  }

  switch (config.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <TextField
          config={config}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
        />
      )

    case 'number':
      return (
        <NumberField
          config={config}
          value={value as number | null}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
        />
      )

    case 'textarea':
      return (
        <TextAreaField
          config={config}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
        />
      )

    case 'checkbox':
      return (
        <CheckboxField
          config={config}
          value={value as boolean}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
        />
      )

    case 'select':
    case 'multiselect':
    case 'radio':
      return (
        <SelectField
          config={config}
          value={value as string | string[]}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
        />
      )

    case 'date':
    case 'time':
    case 'datetime':
      return (
        <DateField
          config={config}
          value={value as string}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          disabled={disabled}
        />
      )

    case 'section':
      return <SectionField config={config}>{children}</SectionField>

    // Placeholder for specialized fields (to be implemented)
    case 'signature':
    case 'photo':
    case 'file':
    case 'ice-depth-grid':
    case 'body-diagram':
      return (
        <div className="form-field w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {config.type.charAt(0).toUpperCase() + config.type.slice(1).replace('-', ' ')} field
            </p>
            <p className="text-sm text-gray-400 mt-1">Coming soon</p>
          </div>
        </div>
      )

    default:
      console.warn(`Unknown field type: ${(config as FieldConfig).type}`)
      return null
  }
}
