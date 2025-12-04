'use client'

import { FormField } from '@/types/forms'
import TextField from './TextField'
import TextareaField from './TextareaField'
import NumberField from './NumberField'
import SelectField from './SelectField'
import CheckboxField from './CheckboxField'
import CheckboxGroupField from './CheckboxGroupField'
import RadioField from './RadioField'
import DateField from './DateField'
import SignatureField from './SignatureField'
import PhotoField from './PhotoField'
import SectionHeader from './SectionHeader'

export {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  CheckboxGroupField,
  RadioField,
  DateField,
  SignatureField,
  PhotoField,
  SectionHeader,
}

interface FieldRendererProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
}

/**
 * Dynamic field renderer based on field type
 */
export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'textarea':
      return (
        <TextareaField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'number':
    case 'decimal':
    case 'temperature':
    case 'measurement':
      return (
        <NumberField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'select':
      return (
        <SelectField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'checkboxGroup':
    case 'multiselect':
      return (
        <CheckboxGroupField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'radio':
      return (
        <RadioField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'date':
    case 'time':
    case 'datetime':
      return (
        <DateField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'signature':
      return (
        <SignatureField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'photo':
    case 'file':
      return (
        <PhotoField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'section':
    case 'heading':
    case 'paragraph':
      return <SectionHeader field={field} />

    default:
      return (
        <div className="text-red-500 text-sm">
          Unknown field type: {field.type}
        </div>
      )
  }
}

/**
 * Field type palette for the form builder
 */
export const fieldPalette = [
  // Basic fields
  { type: 'text', label: 'Text Input', icon: '📝', category: 'basic' as const },
  { type: 'textarea', label: 'Text Area', icon: '📄', category: 'basic' as const },
  { type: 'number', label: 'Number', icon: '🔢', category: 'basic' as const },
  { type: 'decimal', label: 'Decimal', icon: '🔢', category: 'basic' as const },
  { type: 'select', label: 'Dropdown', icon: '📋', category: 'basic' as const },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️', category: 'basic' as const },
  { type: 'radio', label: 'Radio Group', icon: '🔘', category: 'basic' as const },

  // Advanced fields
  { type: 'checkboxGroup', label: 'Checkbox Group', icon: '☑️', category: 'advanced' as const },
  { type: 'multiselect', label: 'Multi-Select', icon: '📋', category: 'advanced' as const },
  { type: 'date', label: 'Date', icon: '📅', category: 'advanced' as const },
  { type: 'time', label: 'Time', icon: '🕐', category: 'advanced' as const },
  { type: 'datetime', label: 'Date & Time', icon: '📅', category: 'advanced' as const },

  // Specialized fields
  { type: 'signature', label: 'Signature', icon: '✍️', category: 'specialized' as const },
  { type: 'photo', label: 'Photo Upload', icon: '📷', category: 'specialized' as const },
  { type: 'file', label: 'File Upload', icon: '📎', category: 'specialized' as const },
  { type: 'temperature', label: 'Temperature', icon: '🌡️', category: 'specialized' as const },
  { type: 'measurement', label: 'Measurement', icon: '📏', category: 'specialized' as const },

  // Layout elements
  { type: 'heading', label: 'Heading', icon: '📰', category: 'layout' as const },
  { type: 'paragraph', label: 'Paragraph', icon: '📝', category: 'layout' as const },
  { type: 'section', label: 'Divider', icon: '➖', category: 'layout' as const },
]
