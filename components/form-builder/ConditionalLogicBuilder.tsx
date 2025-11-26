'use client'

import { useState } from 'react'
import {
  ConditionalLogic,
  ConditionalRule,
  ConditionalOperator,
  FormField,
} from '@/types/form-builder'

interface ConditionalLogicBuilderProps {
  logic: ConditionalLogic | undefined
  availableFields: FormField[]
  currentFieldId: string
  onChange: (logic: ConditionalLogic | undefined) => void
}

const OPERATORS: { value: ConditionalOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'Equals', needsValue: true },
  { value: 'not_equals', label: 'Does not equal', needsValue: true },
  { value: 'contains', label: 'Contains', needsValue: true },
  { value: 'not_contains', label: 'Does not contain', needsValue: true },
  { value: 'greater_than', label: 'Greater than', needsValue: true },
  { value: 'less_than', label: 'Less than', needsValue: true },
  { value: 'greater_than_or_equals', label: 'Greater than or equals', needsValue: true },
  { value: 'less_than_or_equals', label: 'Less than or equals', needsValue: true },
  { value: 'is_empty', label: 'Is empty', needsValue: false },
  { value: 'is_not_empty', label: 'Is not empty', needsValue: false },
  { value: 'is_true', label: 'Is checked', needsValue: false },
  { value: 'is_false', label: 'Is not checked', needsValue: false },
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export default function ConditionalLogicBuilder({
  logic,
  availableFields,
  currentFieldId,
  onChange,
}: ConditionalLogicBuilderProps) {
  const [isEnabled, setIsEnabled] = useState(!!logic)

  // Filter out the current field and non-input fields
  const validFields = availableFields.filter(
    (f) =>
      f.id !== currentFieldId &&
      !['section', 'divider', 'calculated'].includes(f.type)
  )

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined)
      setIsEnabled(false)
    } else {
      onChange({
        action: 'show',
        logicType: 'all',
        conditions: [],
      })
      setIsEnabled(true)
    }
  }

  const handleActionChange = (action: ConditionalLogic['action']) => {
    if (logic) {
      onChange({ ...logic, action })
    }
  }

  const handleLogicTypeChange = (logicType: ConditionalLogic['logicType']) => {
    if (logic) {
      onChange({ ...logic, logicType })
    }
  }

  const addCondition = () => {
    if (!logic || validFields.length === 0) return

    const newCondition: ConditionalRule = {
      id: generateId(),
      sourceFieldId: validFields[0].id,
      operator: 'equals',
      value: '',
    }

    onChange({
      ...logic,
      conditions: [...logic.conditions, newCondition],
    })
  }

  const updateCondition = (index: number, updates: Partial<ConditionalRule>) => {
    if (!logic) return

    const newConditions = [...logic.conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    onChange({ ...logic, conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    if (!logic) return

    const newConditions = logic.conditions.filter((_, i) => i !== index)
    onChange({ ...logic, conditions: newConditions })
  }

  const getFieldOptions = (fieldId: string) => {
    const field = availableFields.find((f) => f.id === fieldId)
    if (field?.options) {
      return field.options
    }
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500 uppercase">
          Conditional Logic
        </h4>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              isEnabled ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {isEnabled && logic && (
        <div className="space-y-3 p-3 bg-gray-100 rounded-lg">
          {/* Action selector */}
          <div className="flex items-center gap-2 text-sm">
            <select
              value={logic.action}
              onChange={(e) => handleActionChange(e.target.value as ConditionalLogic['action'])}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="show">Show</option>
              <option value="hide">Hide</option>
              <option value="require">Require</option>
              <option value="disable">Disable</option>
            </select>
            <span className="text-gray-600">this field when</span>
            <select
              value={logic.logicType}
              onChange={(e) => handleLogicTypeChange(e.target.value as ConditionalLogic['logicType'])}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ALL</option>
              <option value="any">ANY</option>
            </select>
            <span className="text-gray-600">conditions are met:</span>
          </div>

          {/* Conditions list */}
          <div className="space-y-2">
            {logic.conditions.map((condition, index) => {
              const operator = OPERATORS.find((op) => op.value === condition.operator)
              const fieldOptions = getFieldOptions(condition.sourceFieldId)

              return (
                <div
                  key={condition.id}
                  className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                >
                  {/* Source field */}
                  <select
                    value={condition.sourceFieldId}
                    onChange={(e) => updateCondition(index, { sourceFieldId: e.target.value })}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {validFields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, { operator: e.target.value as ConditionalOperator })}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value */}
                  {operator?.needsValue && (
                    fieldOptions ? (
                      <select
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select...</option>
                        {fieldOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={String(condition.value || '')}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add condition button */}
          {validFields.length > 0 ? (
            <button
              type="button"
              onClick={addCondition}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + Add condition
            </button>
          ) : (
            <p className="text-xs text-gray-500">
              Add other fields to the form to create conditions
            </p>
          )}
        </div>
      )}
    </div>
  )
}
