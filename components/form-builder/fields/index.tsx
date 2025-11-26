'use client'

import { FormField, FormSection, FieldType } from '@/types/form-builder'
import TextField from './TextField'
import NumberField from './NumberField'
import DateTimeField from './DateTimeField'
import SelectField from './SelectField'
import CheckboxField from './CheckboxField'
import RadioField from './RadioField'
import SignatureField from './SignatureField'
import PhotoField from './PhotoField'
import SectionField from './SectionField'
import DividerField from './DividerField'

// Re-export all field components
export {
  TextField,
  NumberField,
  DateTimeField,
  SelectField,
  CheckboxField,
  RadioField,
  SignatureField,
  PhotoField,
  SectionField,
  DividerField,
}

interface FieldRendererProps {
  field: FormField
  value?: any
  onChange?: (value: any) => void
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

// Universal field renderer based on field type
export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  isBuilder = false,
  isSelected = false,
  onClick,
}: FieldRendererProps) {
  const commonProps = {
    field,
    value,
    onChange,
    error,
    disabled,
    isBuilder,
    isSelected,
    onClick,
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
      return <TextField {...commonProps} />

    case 'number':
      return <NumberField {...commonProps} />

    case 'date':
    case 'time':
    case 'datetime':
      return <DateTimeField {...commonProps} />

    case 'select':
    case 'multiselect':
      return <SelectField {...commonProps} />

    case 'checkbox':
    case 'toggle':
      return <CheckboxField {...commonProps} />

    case 'radio':
      return <RadioField {...commonProps} />

    case 'signature':
      return <SignatureField {...commonProps} />

    case 'photo':
      return <PhotoField {...commonProps} />

    case 'divider':
      return <DividerField {...commonProps} />

    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Unknown field type: {field.type}
          </p>
        </div>
      )
  }
}

// Get icon for a field type
export function getFieldIcon(type: FieldType): string {
  const icons: Record<FieldType, string> = {
    text: 'T',
    textarea: '¶',
    number: '#',
    email: '@',
    phone: '☎',
    date: '📅',
    time: '🕐',
    datetime: '📆',
    select: '▼',
    multiselect: '☑',
    checkbox: '☐',
    radio: '◉',
    toggle: '◯',
    signature: '✍',
    photo: '📷',
    section: '§',
    divider: '—',
  }
  return icons[type]
}
