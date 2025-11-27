'use client'

import { useState } from 'react'
import type { FormField, ConditionalRule } from '@/types/form-builder'

interface ConditionalLogicEditorProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (rules: ConditionalRule[]) => void
  disabled?: boolean
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
]

const ACTIONS = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Make required' },
  { value: 'disable', label: 'Disable this field' },
]

export default function ConditionalLogicEditor({
  field,
  allFields,
  onUpdate,
  disabled = false,
}: ConditionalLogicEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const rules = field.conditionalRules || []

  // Get fields that can be used as conditions (exclude current field and dividers)
  const availableFields = allFields.filter(
    (f) => f.id !== field.id && !['section', 'divider'].includes(f.type)
  )

  const addRule = () => {
    if (availableFields.length === 0) return

    const newRule: ConditionalRule = {
      fieldId: availableFields[0].id,
      operator: 'equals',
      value: '',
      action: 'show',
    }
    onUpdate([...rules, newRule])
  }

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updates }
    onUpdate(newRules)
  }

  const removeRule = (index: number) => {
    onUpdate(rules.filter((_, i) => i !== index))
  }

  const getFieldLabel = (fieldId: string) => {
    const targetField = allFields.find((f) => f.id === fieldId)
    return targetField?.label || 'Unknown field'
  }

  const needsValue = (operator: string) => {
    return !['isEmpty', 'isNotEmpty'].includes(operator)
  }

  if (['section', 'divider'].includes(field.type)) {
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
          Conditional Logic
          {rules.length > 0 && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {rules.length} rule{rules.length !== 1 ? 's' : ''}
            </span>
          )}
        </span>
        <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No conditions set. This field will always be visible.
            </p>
          ) : (
            rules.map((rule, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Rule {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>

                {/* Action */}
                <div>
                  <select
                    value={rule.action}
                    onChange={(e) => updateRule(index, { action: e.target.value as ConditionalRule['action'] })}
                    className="input w-full text-sm"
                    disabled={disabled}
                  >
                    {ACTIONS.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* When field */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">when</span>
                  <select
                    value={rule.fieldId}
                    onChange={(e) => updateRule(index, { fieldId: e.target.value })}
                    className="input flex-1 text-sm"
                    disabled={disabled}
                  >
                    {availableFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div>
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(index, { operator: e.target.value as ConditionalRule['operator'] })}
                    className="input w-full text-sm"
                    disabled={disabled}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                {needsValue(rule.operator) && (
                  <div>
                    <input
                      type="text"
                      value={String(rule.value || '')}
                      onChange={(e) => updateRule(index, { value: e.target.value })}
                      className="input w-full text-sm"
                      placeholder="Value"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            ))
          )}

          {availableFields.length > 0 && (
            <button
              type="button"
              onClick={addRule}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={disabled}
            >
              + Add Condition
            </button>
          )}

          {availableFields.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              Add more fields to create conditions
            </p>
          )}
        </div>
      )}
    </div>
  )
}
