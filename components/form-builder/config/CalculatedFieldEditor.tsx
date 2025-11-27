'use client'

import { useState } from 'react'
import type { FormField } from '@/types/form-builder'

interface CalculatedFieldConfig {
  formula: string
  sourceFields: string[]
  resultType: 'number' | 'text'
}

interface CalculatedFieldEditorProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (config: CalculatedFieldConfig | undefined) => void
  disabled?: boolean
}

const FORMULA_TEMPLATES = [
  { label: 'Sum', formula: 'SUM({field1}, {field2})', description: 'Add multiple fields' },
  { label: 'Average', formula: 'AVG({field1}, {field2})', description: 'Calculate average' },
  { label: 'Difference', formula: '{field1} - {field2}', description: 'Subtract fields' },
  { label: 'Product', formula: '{field1} * {field2}', description: 'Multiply fields' },
  { label: 'Percentage', formula: '({field1} / {field2}) * 100', description: 'Calculate percentage' },
  { label: 'Custom', formula: '', description: 'Write your own formula' },
]

export default function CalculatedFieldEditor({
  field,
  allFields,
  onUpdate,
  disabled = false,
}: CalculatedFieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCalculated, setIsCalculated] = useState(!!field.defaultValue && typeof field.defaultValue === 'object')

  // Get numeric fields that can be used in calculations
  const numericFields = allFields.filter(
    (f) => f.id !== field.id && f.type === 'number'
  )

  const config = (field.defaultValue as CalculatedFieldConfig | undefined) || {
    formula: '',
    sourceFields: [],
    resultType: 'number' as const,
  }

  const handleToggle = (enabled: boolean) => {
    setIsCalculated(enabled)
    if (!enabled) {
      onUpdate(undefined)
    } else {
      onUpdate({
        formula: '',
        sourceFields: [],
        resultType: 'number',
      })
    }
  }

  const updateConfig = (updates: Partial<CalculatedFieldConfig>) => {
    onUpdate({ ...config, ...updates })
  }

  const insertFieldReference = (fieldId: string) => {
    const targetField = allFields.find((f) => f.id === fieldId)
    if (!targetField) return

    const reference = `{${targetField.name}}`
    const uniqueFields = Array.from(new Set([...config.sourceFields, fieldId]))
    updateConfig({
      formula: config.formula + reference,
      sourceFields: uniqueFields,
    })
  }

  // Only show for number fields
  if (field.type !== 'number') {
    return null
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        disabled={disabled}
      >
        <span className="text-sm font-medium text-gray-700">
          Calculated Field
          {isCalculated && (
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </span>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCalculated}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              disabled={disabled}
            />
            <span className="text-sm text-gray-700">
              Calculate value automatically
            </span>
          </label>

          {isCalculated && (
            <>
              {/* Formula templates */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Formula Template
                </label>
                <select
                  onChange={(e) => {
                    const template = FORMULA_TEMPLATES.find((t) => t.formula === e.target.value)
                    if (template) {
                      updateConfig({ formula: template.formula })
                    }
                  }}
                  className="input w-full text-sm"
                  disabled={disabled}
                >
                  <option value="">Select a template...</option>
                  {FORMULA_TEMPLATES.map((template) => (
                    <option key={template.label} value={template.formula}>
                      {template.label} - {template.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Formula input */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Formula
                </label>
                <textarea
                  value={config.formula}
                  onChange={(e) => updateConfig({ formula: e.target.value })}
                  className="input w-full text-sm font-mono"
                  rows={2}
                  placeholder="e.g., {field1} + {field2}"
                  disabled={disabled}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use {'{fieldName}'} to reference other fields
                </p>
              </div>

              {/* Available fields to insert */}
              {numericFields.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Insert Field Reference
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {numericFields.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => insertFieldReference(f.id)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                        disabled={disabled}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {numericFields.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  Add number fields to use in calculations
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
