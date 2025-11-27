'use client'

import type { FormField } from '@/types/form-builder'
import TextField from './TextField'
import NumberField from './NumberField'
import TextareaField from './TextareaField'
import SelectField from './SelectField'
import CheckboxField from './CheckboxField'
import RadioField from './RadioField'
import DateTimeField from './DateTimeField'
import SignatureField from './SignatureField'
import PhotoField from './PhotoField'
import SectionField from './SectionField'
import DividerField from './DividerField'

interface FieldRendererProps {
  field: FormField
  value?: unknown
  onChange?: (value: unknown) => void
  disabled?: boolean
  error?: string
  preview?: boolean
}

export default function FieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
  preview = false,
}: FieldRendererProps) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <TextField
          field={field}
          value={value as string}
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'number':
      return (
        <NumberField
          field={field}
          value={value as number | string}
          onChange={onChange as (value: number | string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'textarea':
      return (
        <TextareaField
          field={field}
          value={value as string}
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'select':
      return (
        <SelectField
          field={field}
          value={value as string}
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={value as boolean}
          onChange={onChange as (value: boolean) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'radio':
      return (
        <RadioField
          field={field}
          value={value as string}
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
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
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'signature':
      return (
        <SignatureField
          field={field}
          value={value as string}
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'photo':
      return (
        <PhotoField
          field={field}
          value={value as string}
          onChange={onChange as (value: string) => void}
          disabled={disabled}
          error={error}
          preview={preview}
        />
      )

    case 'section':
      return <SectionField field={field} />

    case 'divider':
      return <DividerField />

    default:
      return (
        <div className="text-red-500 text-sm">
          Unknown field type: {field.type}
        </div>
      )
  }
}

export {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  CheckboxField,
  RadioField,
  DateTimeField,
  SignatureField,
  PhotoField,
  SectionField,
  DividerField,
}
