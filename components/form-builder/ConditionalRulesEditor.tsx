'use client'

import { useState } from 'react'
import {
  FormSchema,
  FormField,
  ConditionalRule,
  generateFieldId
} from '@/types/form-builder'

interface ConditionalRulesEditorProps {
  schema: FormSchema
  field: FormField
  sectionId: string
  onUpdate: (rules: ConditionalRule[]) => void
  onClose: () => void
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' }
]

const ACTIONS = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Make required' },
  { value: 'unrequire', label: 'Make optional' }
]

export default function ConditionalRulesEditor({
  schema,
  field,
  sectionId,
  onUpdate,
  onClose
}: ConditionalRulesEditorProps) {
  const [rules, setRules] = useState<ConditionalRule[]>(field.conditionalRules || [])

  // Get all fields that can be used as source (excluding current field)
  const sourceFields: { id: string; name: string; label: string; type: string }[] = []
  for (const section of schema.sections) {
    for (const f of section.fields) {
      if (f.id !== field.id && f.type !== 'section' && f.type !== 'divider') {
        sourceFields.push({
          id: f.name, // Use name as identifier for data matching
          name: f.name,
          label: f.label,
          type: f.type
        })
      }
    }
  }

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: generateFieldId(),
      sourceFieldId: sourceFields[0]?.name || '',
      operator: 'equals',
      value: '',
      action: 'show'
    }
    setRules([...rules, newRule])
  }

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updates }
    setRules(newRules)
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onUpdate(rules)
    onClose()
  }

  const getSourceFieldOptions = (sourceFieldId: string) => {
    const sourceField = sourceFields.find(f => f.name === sourceFieldId)
    if (!sourceField) return null

    // Find the actual field to get options
    for (const section of schema.sections) {
      const f = section.fields.find(f => f.name === sourceFieldId)
      if (f && f.options) {
        return f.options
      }
    }
    return null
  }

  const needsValue = (operator: string) => {
    return !['isEmpty', 'isNotEmpty'].includes(operator)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Conditional Rules</h2>
            <p className="text-sm text-gray-500">
              Control when &quot;{field.label}&quot; is shown or required
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No conditional rules defined</p>
              <p className="text-sm">
                Add rules to control when this field should be visible or required
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Rule {index + 1}
                    </span>
                    <button
                      onClick={() => removeRule(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Action */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Action</label>
                      <select
                        value={rule.action}
                        onChange={(e) => updateRule(index, {
                          action: e.target.value as ConditionalRule['action']
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        {ACTIONS.map(a => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Source Field */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">When field</label>
                      <select
                        value={rule.sourceFieldId}
                        onChange={(e) => updateRule(index, { sourceFieldId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">Select a field...</option>
                        {sourceFields.map(f => (
                          <option key={f.id} value={f.name}>
                            {f.label} ({f.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Operator */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Operator</label>
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(index, {
                          operator: e.target.value as ConditionalRule['operator']
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        {OPERATORS.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    {needsValue(rule.operator) && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Value</label>
                        {getSourceFieldOptions(rule.sourceFieldId) ? (
                          <select
                            value={String(rule.value || '')}
                            onChange={(e) => updateRule(index, { value: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="">Select a value...</option>
                            {getSourceFieldOptions(rule.sourceFieldId)?.map(opt => (
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
                            placeholder="Enter value..."
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rule preview */}
                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    <span className="font-medium">{ACTIONS.find(a => a.value === rule.action)?.label}</span>
                    {' when '}
                    <span className="font-medium">
                      {sourceFields.find(f => f.name === rule.sourceFieldId)?.label || 'field'}
                    </span>
                    {' '}
                    <span className="font-medium">
                      {OPERATORS.find(o => o.value === rule.operator)?.label.toLowerCase()}
                    </span>
                    {needsValue(rule.operator) && (
                      <>
                        {' '}
                        <span className="font-medium">&quot;{rule.value}&quot;</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Rule Button */}
          <button
            onClick={addRule}
            disabled={sourceFields.length === 0}
            className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Conditional Rule
          </button>

          {sourceFields.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Add more fields to the form to enable conditional rules
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Rules
          </button>
        </div>
      </div>
    </div>
  )
}
