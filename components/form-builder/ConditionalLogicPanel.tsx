'use client'

import { useState } from 'react'
import { FormField, ConditionalRule } from '@/types'
import { getOperatorsForFieldType } from '@/lib/form-logic'

interface ConditionalLogicPanelProps {
  fields: FormField[]
  rules: ConditionalRule[]
  onRulesChange: (rules: ConditionalRule[]) => void
  onClose: () => void
}

const actionOptions = [
  { value: 'show', label: 'Show field' },
  { value: 'hide', label: 'Hide field' },
  { value: 'require', label: 'Make required' },
  { value: 'disable', label: 'Disable field' },
]

function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function ConditionalLogicPanel({
  fields,
  rules,
  onRulesChange,
  onClose,
}: ConditionalLogicPanelProps) {
  const [editingRule, setEditingRule] = useState<ConditionalRule | null>(null)

  // Filter out layout fields that can't be used as source/target
  const eligibleFields = fields.filter(
    (f) => !['heading', 'paragraph', 'divider'].includes(f.type)
  )

  const handleAddRule = () => {
    if (eligibleFields.length < 2) {
      alert('You need at least 2 fields to create a conditional rule')
      return
    }

    const newRule: ConditionalRule = {
      id: generateRuleId(),
      sourceFieldId: eligibleFields[0].name,
      operator: 'equals',
      value: '',
      targetFieldId: eligibleFields[1].name,
      action: 'show',
    }
    setEditingRule(newRule)
  }

  const handleSaveRule = (rule: ConditionalRule) => {
    const existingIndex = rules.findIndex((r) => r.id === rule.id)
    if (existingIndex >= 0) {
      const updated = [...rules]
      updated[existingIndex] = rule
      onRulesChange(updated)
    } else {
      onRulesChange([...rules, rule])
    }
    setEditingRule(null)
  }

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter((r) => r.id !== ruleId))
  }

  const getFieldLabel = (fieldName: string): string => {
    const field = fields.find((f) => f.name === fieldName)
    return field?.label || fieldName
  }

  const getFieldType = (fieldName: string): string => {
    const field = fields.find((f) => f.name === fieldName)
    return field?.type || 'text'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Conditional Logic</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingRule ? (
            <RuleEditor
              rule={editingRule}
              fields={eligibleFields}
              onSave={handleSaveRule}
              onCancel={() => setEditingRule(null)}
            />
          ) : (
            <>
              {/* Rules list */}
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔀</div>
                  <h3 className="text-lg font-medium text-gray-900">No conditional rules yet</h3>
                  <p className="text-gray-600 mt-2 mb-6">
                    Add rules to show/hide or modify fields based on user input
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">When</span>{' '}
                          <span className="text-blue-600">{getFieldLabel(rule.sourceFieldId)}</span>{' '}
                          <span className="text-gray-600">{rule.operator}</span>{' '}
                          {rule.value !== undefined && (
                            <span className="text-green-600">&quot;{String(rule.value)}&quot;</span>
                          )}
                          {' → '}
                          <span className="font-medium">{rule.action}</span>{' '}
                          <span className="text-blue-600">{getFieldLabel(rule.targetFieldId)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddRule}
                className="btn btn-primary w-full"
                disabled={eligibleFields.length < 2}
              >
                + Add Rule
              </button>

              {eligibleFields.length < 2 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Add at least 2 fields to create conditional rules
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface RuleEditorProps {
  rule: ConditionalRule
  fields: FormField[]
  onSave: (rule: ConditionalRule) => void
  onCancel: () => void
}

function RuleEditor({ rule, fields, onSave, onCancel }: RuleEditorProps) {
  const [localRule, setLocalRule] = useState<ConditionalRule>(rule)

  const sourceField = fields.find((f) => f.name === localRule.sourceFieldId)
  const operators = getOperatorsForFieldType(sourceField?.type || 'text')

  const needsValue = !['isEmpty', 'isNotEmpty'].includes(localRule.operator)

  const handleChange = (key: keyof ConditionalRule, value: unknown) => {
    setLocalRule((prev) => ({ ...prev, [key]: value }))
  }

  const handleSourceFieldChange = (fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName)
    const newOperators = getOperatorsForFieldType(field?.type || 'text')

    setLocalRule((prev) => ({
      ...prev,
      sourceFieldId: fieldName,
      operator: newOperators[0]?.value as ConditionalRule['operator'] || 'equals',
      value: '',
    }))
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        {rule.id.startsWith('rule_') ? 'New Rule' : 'Edit Rule'}
      </h3>

      {/* Source field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">When this field...</label>
        <select
          value={localRule.sourceFieldId}
          onChange={(e) => handleSourceFieldChange(e.target.value)}
          className="input w-full"
        >
          {fields.map((field) => (
            <option key={field.id} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>
      </div>

      {/* Operator */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <select
          value={localRule.operator}
          onChange={(e) => handleChange('operator', e.target.value)}
          className="input w-full"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {/* Value */}
      {needsValue && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          {sourceField?.options ? (
            <select
              value={String(localRule.value || '')}
              onChange={(e) => handleChange('value', e.target.value)}
              className="input w-full"
            >
              <option value="">Select a value...</option>
              {sourceField.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : sourceField?.type === 'number' ? (
            <input
              type="number"
              value={localRule.value as number || ''}
              onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
              className="input w-full"
            />
          ) : sourceField?.type === 'checkbox' && !sourceField.options ? (
            <select
              value={String(localRule.value || '')}
              onChange={(e) => handleChange('value', e.target.value === 'true')}
              className="input w-full"
            >
              <option value="true">Checked</option>
              <option value="false">Unchecked</option>
            </select>
          ) : (
            <input
              type="text"
              value={String(localRule.value || '')}
              onChange={(e) => handleChange('value', e.target.value)}
              className="input w-full"
              placeholder="Enter value..."
            />
          )}
        </div>
      )}

      {/* Action */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Then...</label>
        <select
          value={localRule.action}
          onChange={(e) => handleChange('action', e.target.value)}
          className="input w-full"
        >
          {actionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Target field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">This field</label>
        <select
          value={localRule.targetFieldId}
          onChange={(e) => handleChange('targetFieldId', e.target.value)}
          className="input w-full"
        >
          {fields
            .filter((f) => f.name !== localRule.sourceFieldId)
            .map((field) => (
              <option key={field.id} value={field.name}>
                {field.label}
              </option>
            ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={() => onSave(localRule)}
          className="btn btn-primary flex-1"
        >
          Save Rule
        </button>
      </div>
    </div>
  )
}
