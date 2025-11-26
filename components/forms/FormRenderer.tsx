'use client'

import { useForm, FormProvider } from 'react-hook-form'
import {
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  DateTimeField,
  TimeField,
  TextAreaField,
  SignatureField,
  PhotoField,
  RadioField,
} from './fields'

// Schema types for dynamic form rendering
export interface FieldSchema {
  id: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'time' | 'datetime' | 'textarea' | 'signature' | 'photo' | 'radio' | 'section' | 'divider'
  label: string
  placeholder?: string
  required?: boolean
  helperText?: string
  // Type-specific options
  options?: { value: string; label: string }[] // For select/radio/checkbox-group
  min?: number
  max?: number
  step?: number
  unit?: string
  maxLength?: number
  rows?: number
  maxFiles?: number
  layout?: 'vertical' | 'horizontal'
  // Conditional display
  showWhen?: {
    field: string
    equals?: any
    notEquals?: any
    contains?: any
  }
  // Section/grouping
  sectionTitle?: string
  sectionDescription?: string
}

export interface FormSchema {
  id: string
  name: string
  description?: string
  fields: FieldSchema[]
}

interface FormRendererProps {
  schema: FormSchema
  initialValues?: Record<string, any>
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  readOnly?: boolean
  submitLabel?: string
  loading?: boolean
}

export default function FormRenderer({
  schema,
  initialValues = {},
  onSubmit,
  readOnly = false,
  submitLabel = 'Submit',
  loading = false,
}: FormRendererProps) {
  const methods = useForm({
    defaultValues: initialValues,
  })

  const { handleSubmit, watch, formState: { errors } } = methods
  const watchedValues = watch()

  // Check if a field should be shown based on conditional logic
  const shouldShowField = (field: FieldSchema): boolean => {
    if (!field.showWhen) return true

    const watchedValue = watchedValues[field.showWhen.field]

    if (field.showWhen.equals !== undefined) {
      return watchedValue === field.showWhen.equals
    }
    if (field.showWhen.notEquals !== undefined) {
      return watchedValue !== field.showWhen.notEquals
    }
    if (field.showWhen.contains !== undefined) {
      return Array.isArray(watchedValue) && watchedValue.includes(field.showWhen.contains)
    }

    return true
  }

  const renderField = (field: FieldSchema) => {
    if (!shouldShowField(field)) return null

    const commonProps = {
      id: field.id,
      label: field.label,
      required: field.required,
      disabled: readOnly,
      helperText: field.helperText,
      error: errors[field.id] as any,
      register: methods.register,
    }

    switch (field.type) {
      case 'section':
        return (
          <div key={field.id} className="pt-6 pb-2">
            <h3 className="text-lg font-semibold text-gray-900">{field.sectionTitle || field.label}</h3>
            {field.sectionDescription && (
              <p className="text-sm text-gray-500 mt-1">{field.sectionDescription}</p>
            )}
          </div>
        )

      case 'divider':
        return <hr key={field.id} className="my-6 border-gray-200" />

      case 'text':
        return (
          <TextField
            key={field.id}
            {...commonProps}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
          />
        )

      case 'number':
        return (
          <NumberField
            key={field.id}
            {...commonProps}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            unit={field.unit}
          />
        )

      case 'select':
        return (
          <SelectField
            key={field.id}
            {...commonProps}
            options={field.options || []}
            placeholder={field.placeholder}
          />
        )

      case 'checkbox':
        return (
          <CheckboxField
            key={field.id}
            {...commonProps}
            description={field.helperText}
          />
        )

      case 'radio':
        return (
          <RadioField
            key={field.id}
            {...commonProps}
            options={field.options || []}
            layout={field.layout}
            value={watchedValues[field.id]}
            onChange={(val) => methods.setValue(field.id, val)}
          />
        )

      case 'date':
        return (
          <DateTimeField
            key={field.id}
            {...commonProps}
            type="date"
          />
        )

      case 'time':
        return (
          <TimeField
            key={field.id}
            {...commonProps}
          />
        )

      case 'datetime':
        return (
          <DateTimeField
            key={field.id}
            {...commonProps}
            type="datetime-local"
          />
        )

      case 'textarea':
        return (
          <TextAreaField
            key={field.id}
            {...commonProps}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={field.rows}
            showCharCount={!!field.maxLength}
          />
        )

      case 'signature':
        return (
          <SignatureField
            key={field.id}
            id={field.id}
            label={field.label}
            required={field.required}
            disabled={readOnly}
            error={errors[field.id]?.message as string}
            value={watchedValues[field.id]}
            onChange={(val) => methods.setValue(field.id, val)}
            helperText={field.helperText}
          />
        )

      case 'photo':
        return (
          <PhotoField
            key={field.id}
            id={field.id}
            label={field.label}
            required={field.required}
            disabled={readOnly}
            error={errors[field.id]?.message as string}
            maxFiles={field.maxFiles}
            onChange={(files) => methods.setValue(field.id, files)}
            helperText={field.helperText}
          />
        )

      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {schema.fields.map(renderField)}

        {!readOnly && (
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => methods.reset()}
              className="btn btn-secondary"
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : submitLabel}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  )
}

// Read-only submission viewer
interface SubmissionViewerProps {
  schema: FormSchema
  data: Record<string, any>
}

export function SubmissionViewer({ schema, data }: SubmissionViewerProps) {
  const renderValue = (field: FieldSchema, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">Not provided</span>
    }

    switch (field.type) {
      case 'checkbox':
        return value ? 'Yes' : 'No'

      case 'select':
      case 'radio':
        const option = field.options?.find((o) => o.value === value)
        return option?.label || value

      case 'signature':
        return value ? (
          <img src={value} alt="Signature" className="max-w-[200px] border rounded" />
        ) : (
          <span className="text-gray-400">No signature</span>
        )

      case 'photo':
        return Array.isArray(value) && value.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {value.map((src: string, i: number) => (
              <img key={i} src={src} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded" />
            ))}
          </div>
        ) : (
          <span className="text-gray-400">No photos</span>
        )

      default:
        return String(value)
    }
  }

  return (
    <div className="space-y-4">
      {schema.fields.map((field) => {
        if (field.type === 'section') {
          return (
            <div key={field.id} className="pt-4 pb-2">
              <h3 className="text-lg font-semibold text-gray-900">{field.sectionTitle || field.label}</h3>
            </div>
          )
        }

        if (field.type === 'divider') {
          return <hr key={field.id} className="my-4 border-gray-200" />
        }

        return (
          <div key={field.id} className="py-2 border-b border-gray-100">
            <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{renderValue(field, data[field.id])}</dd>
          </div>
        )
      })}
    </div>
  )
}
