'use client'

import { FormField } from '@/types'
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  RadioField,
  DateTimeField,
  FileField,
  SignatureField,
  HeadingField,
  ParagraphField,
  DividerField,
} from './fields'

interface FieldRendererProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
  preview?: boolean
}

export function FieldRenderer({ field, value, onChange, error, disabled, preview }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <TextField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'textarea':
      return (
        <TextareaField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'number':
      return (
        <NumberField
          field={field}
          value={value as number | string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'select':
    case 'multiselect':
      return (
        <SelectField
          field={field}
          value={value as string | string[]}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={value as boolean | string[]}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'radio':
      return (
        <RadioField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'date':
    case 'time':
    case 'datetime':
      return (
        <DateTimeField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'file':
    case 'photo':
      return (
        <FileField
          field={field}
          value={value as File | null}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'signature':
      return (
        <SignatureField
          field={field}
          value={value as string}
          onChange={onChange}
          error={error}
          disabled={disabled}
          preview={preview}
        />
      )

    case 'heading':
      return <HeadingField field={field} />

    case 'paragraph':
      return <ParagraphField field={field} />

    case 'divider':
      return <DividerField field={field} />

    default:
      return (
        <div className="text-red-500 text-sm">
          Unknown field type: {field.type}
        </div>
      )
  }
}
