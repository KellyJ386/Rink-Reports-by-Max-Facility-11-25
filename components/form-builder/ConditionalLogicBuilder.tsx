'use client'

import { useState } from 'react'
import type { ConditionalRule, FormField } from '@/types/form-builder'

interface ConditionalLogicBuilderProps {
  rule: ConditionalRule | undefined
  availableFields: FormField[]
  currentFieldId: string
  onChange: (rule: ConditionalRule | undefined) => void
}

const OPERATORS: { value: ConditionalRule['operator']; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater than' },
  { value: 'lessThan', label: 'Less than' },
]

const ACTIONS: { value: ConditionalRule['action']; label: string }[] = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Make required' },
]

export default function ConditionalLogicBuilder({
  rule,
  availableFields,
  currentFieldId,
  onChange,
}: ConditionalLogicBuilderProps) {
  const [isEnabled, setIsEnabled] = useState(!!rule)

  // Filter out layout fields and current field from available fields
  const selectableFields = availableFields.filter(
    (f) =>
      f.id !== currentFieldId &&
      !['heading', 'paragraph', 'divider'].includes(f.type)
  )

  const handleEnable = (enabled: boolean) => {
    setIsEnabled(enabled)
    if (!enabled) {
      onChange(undefined)
    } else if (!rule && selectableFields.length > 0) {
      // Create default rule
      onChange({
        fieldId: selectableFields[0].id,
        operator: 'equals',
        value: '',
        action: 'show',
      })
    }
  }

  const handleRuleChange = <K extends keyof ConditionalRule>(
    key: K,
    value: ConditionalRule[K]
  ) => {
    if (!rule) return
    onChange({ ...rule, [key]: value })
  }

  const selectedField = selectableFields.find((f) => f.id === rule?.fieldId)

  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Conditional Logic
        </h4>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleEnable(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {isEnabled && selectableFields.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          Add more fields to use conditional logic.
        </p>
      )}

      {isEnabled && rule && selectableFields.length > 0 && (
        <div className="space-y-3 bg-gray-100 rounded-lg p-3">
          {/* Action */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <select
              value={rule.action}
              onChange={(e) =>
                handleRuleChange('action', e.target.value as ConditionalRule['action'])
              }
              className="input text-sm"
            >
              {ACTIONS.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          {/* When Field */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">When field</label>
            <select
              value={rule.fieldId}
              onChange={(e) => handleRuleChange('fieldId', e.target.value)}
              className="input text-sm"
            >
              {selectableFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label || field.name}
                </option>
              ))}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Operator</label>
            <select
              value={rule.operator}
              onChange={(e) =>
                handleRuleChange('operator', e.target.value as ConditionalRule['operator'])
              }
              className="input text-sm"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Value</label>
            {selectedField?.options && selectedField.options.length > 0 ? (
              <select
                value={String(rule.value)}
                onChange={(e) => handleRuleChange('value', e.target.value)}
                className="input text-sm"
              >
                <option value="">Select a value...</option>
                {selectedField.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : selectedField?.type === 'checkbox' ? (
              <select
                value={String(rule.value)}
                onChange={(e) => handleRuleChange('value', e.target.value === 'true')}
                className="input text-sm"
              >
                <option value="true">Checked</option>
                <option value="false">Unchecked</option>
              </select>
            ) : selectedField?.type === 'number' ? (
              <input
                type="number"
                value={String(rule.value)}
                onChange={(e) => handleRuleChange('value', Number(e.target.value))}
                className="input text-sm"
                placeholder="Enter a number"
              />
            ) : (
              <input
                type="text"
                value={String(rule.value)}
                onChange={(e) => handleRuleChange('value', e.target.value)}
                className="input text-sm"
                placeholder="Enter a value"
              />
            )}
          </div>

          {/* Preview */}
          <div className="text-xs text-gray-600 bg-white rounded p-2 mt-2">
            <span className="font-medium">Preview:</span>{' '}
            {rule.action === 'show' ? 'Show' : rule.action === 'hide' ? 'Hide' : 'Require'}{' '}
            this field when &quot;{selectedField?.label || 'field'}&quot;{' '}
            {OPERATORS.find((o) => o.value === rule.operator)?.label.toLowerCase()}{' '}
            &quot;{String(rule.value)}&quot;
          </div>
        </div>
      )}
    </div>
  )
}
