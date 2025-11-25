'use client'

import { useEffect, useMemo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import type {
  FormSchema,
  FormData,
  UniversalHeaderData,
  FieldConfig,
} from '@/types/forms'
import {
  evaluateConditionalLogic,
  getInitialFieldStates,
  type FieldState,
} from '@/lib/conditional-logic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Field component imports (will create these next)
import TextField from './fields/TextField'
import TextareaField from './fields/TextareaField'
import NumberField from './fields/NumberField'
import DropdownField from './fields/DropdownField'
import ToggleField from './fields/ToggleField'

interface FormRendererProps {
  schema: FormSchema
  headerData: UniversalHeaderData
  onSubmit: (data: FormData) => void | Promise<void>
  defaultValues?: FormData
  isSubmitting?: boolean
}

export default function FormRenderer({
  schema,
  headerData,
  onSubmit,
  defaultValues = {},
  isSubmitting = false,
}: FormRendererProps) {
  const methods = useForm<FormData>({
    defaultValues,
    mode: 'onBlur',
  })

  const { watch, handleSubmit } = methods
  const formValues = watch()

  // Get all fields from all sections
  const allFields = useMemo(() => {
    return schema.sections.flatMap((section) => section.fields)
  }, [schema.sections])

  // Calculate initial field states
  const initialFieldStates = useMemo(() => {
    return getInitialFieldStates(
      allFields.map((field) => ({
        id: field.id,
        required: field.required,
      }))
    )
  }, [allFields])

  // Evaluate conditional logic based on current form values
  const fieldStates: Map<string, FieldState> = useMemo(() => {
    if (!schema.conditionalRules || schema.conditionalRules.length === 0) {
      return initialFieldStates
    }

    return evaluateConditionalLogic(
      schema.conditionalRules,
      formValues,
      initialFieldStates
    )
  }, [schema.conditionalRules, formValues, initialFieldStates])

  // Render individual field based on type
  const renderField = (field: FieldConfig) => {
    const fieldState = fieldStates.get(field.id) || {
      visible: true,
      required: field.required,
      enabled: true,
    }

    // Don't render hidden fields
    if (!fieldState.visible) {
      return null
    }

    // Props common to all fields
    const commonProps = {
      key: field.id,
      field: {
        ...field,
        required: fieldState.required,
      },
      disabled: !fieldState.enabled || isSubmitting,
    }

    switch (field.type) {
      case 'text':
        return <TextField {...commonProps} />

      case 'textarea':
        return <TextareaField {...commonProps} />

      case 'number':
      case 'temperature':
        return <NumberField {...commonProps} />

      case 'dropdown':
        return <DropdownField {...commonProps} />

      case 'toggle':
        return <ToggleField {...commonProps} />

      case 'sectionHeader':
        return (
          <div key={field.id} className="col-span-full">
            <h3 className="text-lg font-semibold text-navy border-b-2 border-action pb-2">
              {field.label}
            </h3>
          </div>
        )

      default:
        return (
          <div key={field.id} className="p-4 bg-wolf-50 rounded-lg">
            <p className="text-sm text-wolf-600">
              Field type "{field.type}" not yet implemented
            </p>
          </div>
        )
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Universal Header */}
        {(schema.header.includeUser ||
          schema.header.includeFacility ||
          schema.header.includeRink ||
          schema.header.includeDateTime ||
          schema.header.includeOutsideTemp) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Report Information
                <Badge variant="info">Auto-populated</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {schema.header.includeUser && (
                  <div>
                    <span className="font-medium text-wolf-600">
                      Submitted By:
                    </span>{' '}
                    <span className="text-navy">{headerData.userName}</span>
                  </div>
                )}

                {schema.header.includeFacility && (
                  <div>
                    <span className="font-medium text-wolf-600">
                      Facility:
                    </span>{' '}
                    <span className="text-navy">{headerData.facilityName}</span>
                  </div>
                )}

                {schema.header.includeRink && headerData.rinkName && (
                  <div>
                    <span className="font-medium text-wolf-600">Rink:</span>{' '}
                    <span className="text-navy">{headerData.rinkName}</span>
                  </div>
                )}

                {schema.header.includeDateTime && (
                  <div>
                    <span className="font-medium text-wolf-600">
                      Date & Time:
                    </span>{' '}
                    <span className="text-navy">
                      {new Date(headerData.submittedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {schema.header.includeOutsideTemp &&
                  headerData.outsideTemp !== undefined && (
                    <div>
                      <span className="font-medium text-wolf-600">
                        Outside Temperature:
                      </span>{' '}
                      <span className="text-navy">
                        {headerData.outsideTemp}° {headerData.outsideTempUnit}
                      </span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Sections */}
        {schema.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && (
                <p className="text-sm text-wolf-600 mt-1">
                  {section.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => renderField(field))}
              </div>
            </CardContent>
          </Card>
        ))}
      </form>
    </FormProvider>
  )
}
