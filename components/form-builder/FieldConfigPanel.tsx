'use client'

import { useState } from 'react'
import type { FormField, FormSchema, FieldOption, ConditionalRule, CalculatedFieldConfig, WeatherFieldConfig } from './types'
import { fieldRegistry } from './fields'
import { ConditionalLogicBuilder } from './ConditionalLogicBuilder'
import { CalculatedFieldBuilder } from './CalculatedFieldBuilder'
import { WeatherFieldConfigPanel } from './fields/WeatherField'
import { BodyDiagramConfig as BodyDiagramConfigPanel } from './fields/BodyDiagramField'

interface FieldConfigPanelProps {
  field: FormField
  allFields?: FormField[]
  onUpdate: (updates: Partial<FormField>) => void
  onClose: () => void
}

export function FieldConfigPanel({ field, allFields = [], onUpdate, onClose }: FieldConfigPanelProps) {
  const config = fieldRegistry[field.type]
  const [newOption, setNewOption] = useState('')

  // Check if field type supports options
  const hasOptions = ['select', 'checkboxGroup', 'radioGroup'].includes(field.type)

  // Check if field type supports validation
  const hasValidation = ['text', 'textarea', 'number', 'email', 'phone'].includes(field.type)
  const isNumeric = field.type === 'number'

  const addOption = () => {
    if (!newOption.trim()) return
    const value = newOption.toLowerCase().replace(/\s+/g, '_')
    const newOptions = [...(field.options || []), { value, label: newOption.trim() }]
    onUpdate({ options: newOptions })
    setNewOption('')
  }

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index)
    onUpdate({ options: newOptions })
  }

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = field.options?.map((opt, i) => {
      if (i !== index) return opt
      return { ...opt, ...updates }
    })
    onUpdate({ options: newOptions })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="text-gray-600">{config?.icon}</div>
          <h3 className="font-semibold text-gray-900">Field Settings</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Basic Settings</h4>

          {/* Label */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="input w-full"
              placeholder="Field label"
            />
          </div>

          {/* Placeholder */}
          {!['checkbox', 'checkboxGroup', 'radioGroup', 'section', 'signature', 'photo'].includes(
            field.type
          ) && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="input w-full"
                placeholder="Placeholder text"
              />
            </div>
          )}

          {/* Help text */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Help Text</label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              className="input w-full"
              placeholder="Additional guidance for users"
            />
          </div>

          {/* Required toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="required"
              checked={field.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="required" className="text-sm text-gray-700">
              Required field
            </label>
          </div>
        </div>

        {/* Options section for select/checkbox/radio */}
        {hasOptions && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Options</h4>

            {/* Existing options */}
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(index, { label: e.target.value })}
                    className="input flex-1"
                    placeholder="Option label"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
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
              ))}
            </div>

            {/* Add new option */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addOption()
                  }
                }}
                className="input flex-1"
                placeholder="Add new option"
              />
              <button
                type="button"
                onClick={addOption}
                className="btn btn-secondary"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Validation section */}
        {hasValidation && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Validation</h4>

            {isNumeric ? (
              <>
                {/* Min/Max for numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Minimum</label>
                    <input
                      type="number"
                      value={field.validation?.min ?? ''}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            min: e.target.value ? parseFloat(e.target.value) : undefined,
                          },
                        })
                      }
                      className="input w-full"
                      placeholder="No min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Maximum</label>
                    <input
                      type="number"
                      value={field.validation?.max ?? ''}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            max: e.target.value ? parseFloat(e.target.value) : undefined,
                          },
                        })
                      }
                      className="input w-full"
                      placeholder="No max"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Min/Max length for text */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Min Length</label>
                    <input
                      type="number"
                      min="0"
                      value={field.validation?.minLength ?? ''}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            minLength: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      className="input w-full"
                      placeholder="No min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Max Length</label>
                    <input
                      type="number"
                      min="0"
                      value={field.validation?.maxLength ?? ''}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                      className="input w-full"
                      placeholder="No max"
                    />
                  </div>
                </div>

                {/* Pattern */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pattern (Regex)</label>
                  <input
                    type="text"
                    value={field.validation?.pattern || ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          pattern: e.target.value || undefined,
                        },
                      })
                    }
                    className="input w-full font-mono text-sm"
                    placeholder="^[A-Za-z]+$"
                  />
                </div>

                {field.validation?.pattern && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Pattern Error Message</label>
                    <input
                      type="text"
                      value={field.validation?.patternMessage || ''}
                      onChange={(e) =>
                        onUpdate({
                          validation: {
                            ...field.validation,
                            patternMessage: e.target.value || undefined,
                          },
                        })
                      }
                      className="input w-full"
                      placeholder="Invalid format"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Default value */}
        {!['signature', 'photo', 'iceDepthGrid', 'bodyDiagram', 'section', 'calculated', 'weather'].includes(field.type) && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Default Value</h4>
            <div>
              {field.type === 'checkbox' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="defaultValue"
                    checked={Boolean(field.defaultValue)}
                    onChange={(e) => onUpdate({ defaultValue: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="defaultValue" className="text-sm text-gray-700">
                    Checked by default
                  </label>
                </div>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  value={(field.defaultValue as number) ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      defaultValue: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="input w-full"
                  placeholder="No default"
                />
              ) : hasOptions ? (
                <select
                  value={(field.defaultValue as string) || ''}
                  onChange={(e) => onUpdate({ defaultValue: e.target.value || undefined })}
                  className="input w-full"
                >
                  <option value="">No default</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={(field.defaultValue as string) || ''}
                  onChange={(e) => onUpdate({ defaultValue: e.target.value || undefined })}
                  className="input w-full"
                  placeholder="No default"
                />
              )}
            </div>
          </div>
        )}

        {/* Calculated Field Configuration */}
        {field.type === 'calculated' && (
          <div className="space-y-4 border-t pt-4">
            <CalculatedFieldBuilder
              field={field}
              allFields={allFields}
              onUpdate={(calculatedConfig) => onUpdate({ calculatedConfig })}
            />
          </div>
        )}

        {/* Weather Field Configuration */}
        {field.type === 'weather' && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700">Weather Settings</h4>
            <WeatherFieldConfigPanel
              field={field}
              onUpdate={(weatherConfig) => onUpdate({ weatherConfig })}
            />
          </div>
        )}

        {/* Body Diagram Configuration */}
        {field.type === 'bodyDiagram' && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700">Body Diagram Settings</h4>
            <BodyDiagramConfigPanel
              field={field}
              onUpdate={(config) => onUpdate({ bodyDiagramConfig: { ...config, markers: field.bodyDiagramConfig?.markers || [] } })}
            />
          </div>
        )}

        {/* Conditional Logic - available for all non-section fields */}
        {field.type !== 'section' && allFields.length > 1 && (
          <div className="space-y-4 border-t pt-4">
            <ConditionalLogicBuilder
              field={field}
              allFields={allFields}
              onUpdate={(conditionalRules) => onUpdate({ conditionalRules })}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <p className="text-xs text-gray-500">
          Field ID: <code className="bg-gray-100 px-1 rounded">{field.id}</code>
        </p>
      </div>
    </div>
  )
}
