'use client'

import { useState } from 'react'
import type { FormField, ConditionalRule, FormSchema } from './types'

interface ConditionalLogicBuilderProps {
  field: FormField
  allFields: FormField[]
  onUpdate: (rules: ConditionalRule[]) => void
}

const operators = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'greaterThan', label: 'is greater than' },
  { value: 'lessThan', label: 'is less than' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
] as const

const actions = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Make required' },
  { value: 'disable', label: 'Disable this field' },
] as const

export function ConditionalLogicBuilder({
  field,
  allFields,
  onUpdate,
}: ConditionalLogicBuilderProps) {
  const rules = field.conditionalRules || []

  // Filter out current field and section fields from available fields
  const availableFields = allFields.filter(
    (f) => f.id !== field.id && f.type !== 'section'
  )

  const addRule = () => {
    const newRule: ConditionalRule = {
      field: availableFields[0]?.id || '',
      operator: 'equals',
      value: '',
      action: 'show',
    }
    onUpdate([...rules, newRule])
  }

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newRules = rules.map((rule, i) => {
      if (i !== index) return rule
      return { ...rule, ...updates }
    })
    onUpdate(newRules)
  }

  const removeRule = (index: number) => {
    onUpdate(rules.filter((_, i) => i !== index))
  }

  const getFieldOptions = (fieldId: string) => {
    const targetField = allFields.find((f) => f.id === fieldId)
    if (!targetField) return null

    if (['select', 'radioGroup'].includes(targetField.type)) {
      return targetField.options
    }
    if (targetField.type === 'checkbox') {
      return [
        { value: 'true', label: 'Checked' },
        { value: 'false', label: 'Unchecked' },
      ]
    }
    return null
  }

  const needsValue = (operator: string) => {
    return !['isEmpty', 'isNotEmpty'].includes(operator)
  }

  if (availableFields.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Add more fields to create conditional rules
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Conditional Logic</h4>
        <button
          type="button"
          onClick={addRule}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-gray-500">
          No conditional rules. This field will always be visible.
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => {
            const fieldOptions = getFieldOptions(rule.field)

            return (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border space-y-3"
              >
                {/* Action */}
                <div className="flex items-center gap-2">
                  <select
                    value={rule.action}
                    onChange={(e) =>
                      updateRule(index, { action: e.target.value as ConditionalRule['action'] })
                    }
                    className="input text-sm"
                  >
                    {actions.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">when</span>
                </div>

                {/* Condition */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Field selector */}
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(index, { field: e.target.value, value: '' })}
                    className="input text-sm"
                  >
                    {availableFields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(index, { operator: e.target.value as ConditionalRule['operator'] })
                    }
                    className="input text-sm"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value */}
                  {needsValue(rule.operator) && (
                    <>
                      {fieldOptions ? (
                        <select
                          value={String(rule.value)}
                          onChange={(e) => updateRule(index, { value: e.target.value })}
                          className="input text-sm"
                        >
                          <option value="">Select value</option>
                          {fieldOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={String(rule.value || '')}
                          onChange={(e) => updateRule(index, { value: e.target.value })}
                          placeholder="Value"
                          className="input text-sm w-32"
                        />
                      )}
                    </>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rules.length > 0 && (
        <p className="text-xs text-gray-500">
          Multiple rules are combined with AND logic
        </p>
      )}
    </div>
  )
}

// Conditional logic evaluation engine
export function evaluateConditions(
  rules: ConditionalRule[],
  values: Record<string, unknown>
): { show: boolean; required: boolean; disabled: boolean } {
  // Default state
  let show = true
  let required = false
  let disabled = false

  // No rules means always show
  if (!rules || rules.length === 0) {
    return { show, required, disabled }
  }

  // Evaluate each rule (AND logic)
  for (const rule of rules) {
    const fieldValue = values[rule.field]
    let conditionMet = false

    switch (rule.operator) {
      case 'equals':
        conditionMet = String(fieldValue) === String(rule.value)
        break
      case 'notEquals':
        conditionMet = String(fieldValue) !== String(rule.value)
        break
      case 'contains':
        conditionMet =
          typeof fieldValue === 'string' &&
          fieldValue.toLowerCase().includes(String(rule.value).toLowerCase())
        break
      case 'greaterThan':
        conditionMet = Number(fieldValue) > Number(rule.value)
        break
      case 'lessThan':
        conditionMet = Number(fieldValue) < Number(rule.value)
        break
      case 'isEmpty':
        conditionMet =
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        break
      case 'isNotEmpty':
        conditionMet =
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== '' &&
          !(Array.isArray(fieldValue) && fieldValue.length === 0)
        break
    }

    // Apply action based on whether condition is met
    switch (rule.action) {
      case 'show':
        if (!conditionMet) show = false
        break
      case 'hide':
        if (conditionMet) show = false
        break
      case 'require':
        if (conditionMet) required = true
        break
      case 'disable':
        if (conditionMet) disabled = true
        break
    }
  }

  return { show, required, disabled }
}

// Get all fields that this field depends on
export function getDependentFields(rules: ConditionalRule[]): string[] {
  if (!rules) return []
  return Array.from(new Set(rules.map((r) => r.field)))
}
