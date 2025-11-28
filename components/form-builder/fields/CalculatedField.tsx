'use client'

import { useMemo } from 'react'
import type { FormField } from '@/types/form-builder'
import { calculateFieldValue } from '@/types/form-builder'

interface CalculatedFieldProps {
  field: FormField
  formData: Record<string, unknown>
  error?: string
}

export default function CalculatedField({
  field,
  formData,
  error,
}: CalculatedFieldProps) {
  const calculatedValue = useMemo(() => {
    if (!field.calculatedConfig) return ''
    return calculateFieldValue(field.calculatedConfig, formData)
  }, [field.calculatedConfig, formData])

  const operationLabel = field.calculatedConfig?.operation
    ? {
        sum: 'Sum',
        average: 'Average',
        min: 'Minimum',
        max: 'Maximum',
        count: 'Count',
        custom: 'Custom',
      }[field.calculatedConfig.operation]
    : ''

  return (
    <div className={`${field.width === 'half' ? 'w-1/2' : field.width === 'third' ? 'w-1/3' : 'w-full'}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        <span className="ml-2 text-xs text-gray-400 font-normal">
          ({operationLabel})
        </span>
      </label>

      <div className="bg-gray-100 border border-gray-200 rounded-md px-4 py-3">
        <div className="text-2xl font-semibold text-gray-900">
          {calculatedValue || '-'}
        </div>

        {field.calculatedConfig?.sourceFields && field.calculatedConfig.sourceFields.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Based on: {field.calculatedConfig.sourceFields.join(', ')}
          </div>
        )}
      </div>

      {field.helpText && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
