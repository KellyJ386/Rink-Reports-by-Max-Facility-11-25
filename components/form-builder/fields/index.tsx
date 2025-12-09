'use client'

import type { FormField } from '@/types/form-builder'
import TextField from './TextField'
import TextareaField from './TextareaField'
import NumberField from './NumberField'
import SelectField from './SelectField'
import CheckboxField from './CheckboxField'
import RadioField from './RadioField'
import DateField from './DateField'
import TemperatureField from './TemperatureField'
import CalculatedField from './CalculatedField'
import IceDepthGridField from './IceDepthGridField'
import BodyDiagramField from './BodyDiagramField'
import { HeadingField, ParagraphField, DividerField } from './LayoutFields'

interface FieldRendererProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
  formData?: Record<string, unknown>
}

export function FieldRenderer({ field, value, onChange, error, disabled, formData = {} }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <TextField
          field={field}
          value={(value as string) || ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'textarea':
      return (
        <TextareaField
          field={field}
          value={(value as string) || ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'number':
      return (
        <NumberField
          field={field}
          value={(value as number | string) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'select':
    case 'multiselect':
      return (
        <SelectField
          field={field}
          value={(value as string | string[]) || (field.type === 'multiselect' ? [] : '')}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={(value as boolean) || false}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'radio':
      return (
        <RadioField
          field={field}
          value={(value as string) || ''}
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
          value={(value as string) || ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'heading':
      return <HeadingField field={field} />

    case 'paragraph':
      return <ParagraphField field={field} />

    case 'divider':
      return <DividerField />

    case 'temperature':
      return (
        <TemperatureField
          field={field}
          value={(value as number | string) ?? ''}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'calculated':
      return (
        <CalculatedField
          field={field}
          formData={formData}
          error={error}
        />
      )

    case 'iceDepthGrid':
      return (
        <IceDepthGridField
          field={field}
          value={value as Record<string, number> | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'bodyDiagram':
      return (
        <BodyDiagramField
          field={field}
          value={value as Array<{ id: string; x: number; y: number; type: string; view: 'front' | 'back'; notes?: string }> | undefined}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      )

    case 'signature':
    case 'photo':
      // Placeholder for media fields
      return (
        <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          <p className="text-sm">{field.label}</p>
          <p className="text-xs mt-1">({field.type} - coming soon)</p>
        </div>
      )

    default:
      return (
        <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          Unknown field type: {field.type}
        </div>
      )
  }
}

export { TextField, TextareaField, NumberField, SelectField, CheckboxField, RadioField, DateField }
export { TemperatureField, CalculatedField, IceDepthGridField, BodyDiagramField }
export { HeadingField, ParagraphField, DividerField }
