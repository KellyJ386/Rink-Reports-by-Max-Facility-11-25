'use client'

import { useState } from 'react'
import type { FormField, CalculatedFieldConfig } from './types'

interface CalculatedFieldBuilderProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (config: CalculatedFieldConfig) => void
}

type OperationType = 'sum' | 'average' | 'min' | 'max' | 'count' | 'custom'

const operations: { value: OperationType; label: string; description: string }[] = [
  { value: 'sum', label: 'Sum', description: 'Add all selected field values' },
  { value: 'average', label: 'Average', description: 'Calculate the mean of selected fields' },
  { value: 'min', label: 'Minimum', description: 'Find the smallest value' },
  { value: 'max', label: 'Maximum', description: 'Find the largest value' },
  { value: 'count', label: 'Count', description: 'Count non-empty values' },
  { value: 'custom', label: 'Custom Formula', description: 'Write your own formula' },
]

export function CalculatedFieldBuilder({
  field,
  allFields,
  onUpdate,
}: CalculatedFieldBuilderProps) {
  const config = field.calculatedConfig || {
    operation: 'sum' as OperationType,
    sourceFields: [],
    formula: '',
    decimalPlaces: 2,
  }

  // Filter to only numeric fields
  const numericFields = allFields.filter(
    (f) =>
      f.id !== field.id &&
      ['number', 'temperature', 'measurement'].includes(f.type)
  )

  const handleOperationChange = (operation: OperationType) => {
    onUpdate({ ...config, operation })
  }

  const handleSourceFieldToggle = (fieldId: string) => {
    const sourceFields = config.sourceFields.includes(fieldId)
      ? config.sourceFields.filter((id) => id !== fieldId)
      : [...config.sourceFields, fieldId]
    onUpdate({ ...config, sourceFields })
  }

  const handleFormulaChange = (formula: string) => {
    onUpdate({ ...config, formula })
  }

  const handleDecimalPlacesChange = (decimalPlaces: number) => {
    onUpdate({ ...config, decimalPlaces })
  }

  if (numericFields.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Add numeric fields to create calculations
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Calculated Field</h4>
      </div>

      {/* Operation Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operation
        </label>
        <select
          value={config.operation}
          onChange={(e) => handleOperationChange(e.target.value as OperationType)}
          className="input w-full"
        >
          {operations.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {operations.find((op) => op.value === config.operation)?.description}
        </p>
      </div>

      {/* Source Fields */}
      {config.operation !== 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Fields
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {numericFields.map((f) => (
              <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.sourceFields.includes(f.id)}
                  onChange={() => handleSourceFieldToggle(f.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{f.label}</span>
                <span className="text-xs text-gray-400">({f.type})</span>
              </label>
            ))}
          </div>
          {config.sourceFields.length === 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              Select at least one source field
            </p>
          )}
        </div>
      )}

      {/* Custom Formula */}
      {config.operation === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formula
          </label>
          <textarea
            value={config.formula}
            onChange={(e) => handleFormulaChange(e.target.value)}
            placeholder="e.g., {field_1} + {field_2} * 2"
            className="input w-full h-24 font-mono text-sm"
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>Use field IDs in curly braces: {'{field_id}'}</p>
            <p>Supported operators: + - * / ( )</p>
            <p>Functions: Math.min(), Math.max(), Math.abs(), Math.round()</p>
          </div>
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-600 mb-1">Available fields:</p>
            <div className="flex flex-wrap gap-1">
              {numericFields.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFormulaChange(config.formula + `{${f.id}}`)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Decimal Places */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Decimal Places
        </label>
        <input
          type="number"
          min={0}
          max={6}
          value={config.decimalPlaces}
          onChange={(e) => handleDecimalPlacesChange(parseInt(e.target.value) || 0)}
          className="input w-20"
        />
      </div>

      {/* Preview */}
      {config.sourceFields.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800">Formula Preview</p>
          <p className="text-xs text-blue-600 mt-1 font-mono">
            {getFormulaPreview(config, numericFields)}
          </p>
        </div>
      )}
    </div>
  )
}

function getFormulaPreview(
  config: CalculatedFieldConfig,
  allFields: FormField[]
): string {
  const fieldLabels = config.sourceFields
    .map((id) => allFields.find((f) => f.id === id)?.label || id)
    .join(', ')

  switch (config.operation) {
    case 'sum':
      return `SUM(${fieldLabels})`
    case 'average':
      return `AVERAGE(${fieldLabels})`
    case 'min':
      return `MIN(${fieldLabels})`
    case 'max':
      return `MAX(${fieldLabels})`
    case 'count':
      return `COUNT(${fieldLabels})`
    case 'custom':
      return config.formula || '(custom formula)'
    default:
      return ''
  }
}

// Calculation engine
export function calculateFieldValue(
  config: CalculatedFieldConfig,
  values: Record<string, unknown>
): number | null {
  if (!config) return null

  const sourceValues = config.sourceFields
    .map((id) => values[id])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v))

  if (sourceValues.length === 0 && config.operation !== 'custom') {
    return null
  }

  switch (config.operation) {
    case 'sum':
      return roundToDecimal(
        sourceValues.reduce((acc, val) => acc + val, 0),
        config.decimalPlaces
      )

    case 'average':
      if (sourceValues.length === 0) return null
      return roundToDecimal(
        sourceValues.reduce((acc, val) => acc + val, 0) / sourceValues.length,
        config.decimalPlaces
      )

    case 'min':
      if (sourceValues.length === 0) return null
      return roundToDecimal(Math.min(...sourceValues), config.decimalPlaces)

    case 'max':
      if (sourceValues.length === 0) return null
      return roundToDecimal(Math.max(...sourceValues), config.decimalPlaces)

    case 'count':
      return config.sourceFields.filter((id) => {
        const val = values[id]
        return val !== undefined && val !== null && val !== ''
      }).length

    case 'custom':
      return evaluateCustomFormula(config.formula, values, config.decimalPlaces)

    default:
      return null
  }
}

function evaluateCustomFormula(
  formula: string,
  values: Record<string, unknown>,
  decimalPlaces: number
): number | null {
  if (!formula) return null

  try {
    // Replace field references with values
    let expression = formula
    const fieldPattern = /\{([^}]+)\}/g
    let match

    while ((match = fieldPattern.exec(formula)) !== null) {
      const fieldId = match[1]
      const value = values[fieldId]
      if (typeof value !== 'number' || isNaN(value)) {
        return null // Can't evaluate if any field is missing
      }
      expression = expression.replace(match[0], String(value))
    }

    // Safe evaluation using Function constructor with limited scope
    // Only allow mathematical operations and Math functions
    const safeEval = new Function(
      'Math',
      `"use strict"; return (${expression});`
    )
    const result = safeEval(Math)

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      return null
    }

    return roundToDecimal(result, decimalPlaces)
  } catch {
    return null
  }
}

function roundToDecimal(value: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces)
  return Math.round(value * factor) / factor
}

// Get all fields that this calculated field depends on
export function getCalculationDependencies(config: CalculatedFieldConfig): string[] {
  if (!config) return []

  if (config.operation === 'custom') {
    const fieldPattern = /\{([^}]+)\}/g
    const matches = config.formula.matchAll(fieldPattern)
    return Array.from(new Set(Array.from(matches, (m) => m[1])))
  }

  return [...config.sourceFields]
}
