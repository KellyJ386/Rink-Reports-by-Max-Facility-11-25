'use client'

import { FormField, evaluateCalculatedField } from '@/types/form-builder'
import FieldWrapper from './FieldWrapper'

interface CalculatedFieldProps {
  field: FormField
  allFields: FormField[]
  formValues: Record<string, any>
  error?: string
  disabled?: boolean
  isBuilder?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export default function CalculatedField({
  field,
  allFields,
  formValues,
  error,
  isBuilder = false,
  isSelected = false,
  onClick,
}: CalculatedFieldProps) {
  const config = field.calculatedConfig

  if (!config) {
    return (
      <FieldWrapper
        field={field}
        error={error}
        isBuilder={isBuilder}
        isSelected={isSelected}
        onClick={onClick}
      >
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Calculated field not configured</p>
        </div>
      </FieldWrapper>
    )
  }

  // Calculate the value
  const calculatedValue = isBuilder
    ? 0
    : evaluateCalculatedField(config, formValues, allFields)

  // Format the display value
  const displayValue = `${config.prefix || ''}${calculatedValue}${config.suffix || ''}`

  return (
    <FieldWrapper
      field={field}
      error={error}
      isBuilder={isBuilder}
      isSelected={isSelected}
      onClick={onClick}
    >
      <div
        className={`px-4 py-3 rounded-lg border ${
          isBuilder ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="text-2xl font-semibold text-gray-900">
          {isBuilder ? (
            <span className="text-gray-400">= calculated value</span>
          ) : (
            displayValue
          )}
        </div>
        {isBuilder && config.formula.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 font-mono">
            Formula: {config.formula.length} steps
          </div>
        )}
      </div>
    </FieldWrapper>
  )
}
