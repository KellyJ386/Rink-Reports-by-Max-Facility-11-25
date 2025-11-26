'use client'

import { useState } from 'react'
import {
  FormField,
  SelectOption,
  ValidationRule,
  ConditionalLogic,
  CalculatedFieldConfig,
  IceDepthGridConfig,
  BodyDiagramConfig,
  getDefaultIceDepthPoints,
} from '@/types/form-builder'
import { getFieldIcon } from './fields'
import ConditionalLogicBuilder from './ConditionalLogicBuilder'

interface FieldConfigPanelProps {
  field: FormField | null
  allFields: FormField[]
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export default function FieldConfigPanel({
  field,
  allFields,
  onUpdate,
  onClose,
}: FieldConfigPanelProps) {
  if (!field) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Field Properties
        </h3>
        <p className="text-sm text-gray-500">
          Select a field to edit its properties
        </p>
      </div>
    )
  }

  const updateField = (updates: Partial<FormField>) => {
    onUpdate({ ...field, ...updates })
  }

  const hasOptions = ['select', 'multiselect', 'radio'].includes(field.type)
  const hasValidation = !['section', 'divider', 'ice_depth_grid', 'body_diagram', 'calculated'].includes(field.type)
  const hasConditionalLogic = !['section', 'divider'].includes(field.type)
  const isSpecialized = ['ice_depth_grid', 'body_diagram', 'calculated'].includes(field.type)

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded">
            {getFieldIcon(field.type)}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{field.type}</h3>
            <p className="text-xs text-gray-500">Field settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Settings */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Basic
          </h4>

          {/* Label */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Name/ID */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) =>
                updateField({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to identify this field in form data
            </p>
          </div>

          {/* Placeholder */}
          {['text', 'textarea', 'number', 'email', 'phone'].includes(field.type) && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Help Text */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Width */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <select
              value={field.width || 'full'}
              onChange={(e) =>
                updateField({ width: e.target.value as 'full' | 'half' | 'third' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">Third Width</option>
            </select>
          </div>
        </div>

        {/* Options (for select, radio, etc.) */}
        {hasOptions && (
          <OptionsEditor
            options={field.options || []}
            onChange={(options) => updateField({ options })}
          />
        )}

        {/* Validation */}
        {hasValidation && (
          <ValidationEditor
            fieldType={field.type}
            validation={field.validation || []}
            onChange={(validation) => updateField({ validation })}
          />
        )}

        {/* Conditional Logic */}
        {hasConditionalLogic && (
          <ConditionalLogicBuilder
            logic={field.conditionalLogic}
            availableFields={allFields}
            currentFieldId={field.id}
            onChange={(logic) => updateField({ conditionalLogic: logic })}
          />
        )}

        {/* Specialized Field Configuration */}
        {field.type === 'ice_depth_grid' && field.iceDepthGridConfig && (
          <IceDepthGridConfigEditor
            config={field.iceDepthGridConfig}
            onChange={(config) => updateField({ iceDepthGridConfig: config })}
          />
        )}

        {field.type === 'body_diagram' && field.bodyDiagramConfig && (
          <BodyDiagramConfigEditor
            config={field.bodyDiagramConfig}
            onChange={(config) => updateField({ bodyDiagramConfig: config })}
          />
        )}

        {field.type === 'calculated' && field.calculatedConfig && (
          <CalculatedFieldConfigEditor
            config={field.calculatedConfig}
            allFields={allFields}
            currentFieldId={field.id}
            onChange={(config) => updateField({ calculatedConfig: config })}
          />
        )}

        {/* Advanced */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Advanced
          </h4>

          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={field.isLocked || false}
              onChange={(e) => updateField({ isLocked: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Locked (compliance field)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.isHidden || false}
              onChange={(e) => updateField({ isHidden: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Hidden field</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// Options editor for select/radio fields
interface OptionsEditorProps {
  options: SelectOption[]
  onChange: (options: SelectOption[]) => void
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const addOption = () => {
    const newOption: SelectOption = {
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    }
    onChange([...options, newOption])
  }

  const updateOption = (index: number, updates: Partial<SelectOption>) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], ...updates }
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Options
      </h4>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
              placeholder="Label"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={option.value}
              onChange={(e) =>
                updateOption(index, {
                  value: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                })
              }
              placeholder="Value"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => removeOption(index)}
              className="px-2 text-gray-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
      >
        + Add option
      </button>
    </div>
  )
}

// Validation editor
interface ValidationEditorProps {
  fieldType: string
  validation: ValidationRule[]
  onChange: (validation: ValidationRule[]) => void
}

function ValidationEditor({
  fieldType,
  validation,
  onChange,
}: ValidationEditorProps) {
  const isRequired = validation.some((v) => v.type === 'required')

  const toggleRequired = () => {
    if (isRequired) {
      onChange(validation.filter((v) => v.type !== 'required'))
    } else {
      onChange([...validation, { type: 'required', message: 'This field is required' }])
    }
  }

  const getMinMax = (type: 'min' | 'max') => {
    return validation.find((v) => v.type === type)
  }

  const updateMinMax = (
    type: 'min' | 'max' | 'minLength' | 'maxLength',
    value: string
  ) => {
    const existing = validation.filter((v) => v.type !== type)
    if (value) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        existing.push({
          type,
          value: num,
          message:
            type === 'min'
              ? `Minimum value is ${num}`
              : type === 'max'
              ? `Maximum value is ${num}`
              : type === 'minLength'
              ? `Minimum length is ${num} characters`
              : `Maximum length is ${num} characters`,
        })
      }
    }
    onChange(existing)
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Validation
      </h4>

      <label className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={toggleRequired}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Required</span>
      </label>

      {fieldType === 'number' && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Min</label>
            <input
              type="number"
              value={String(getMinMax('min')?.value ?? '')}
              onChange={(e) => updateMinMax('min', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Max</label>
            <input
              type="number"
              value={String(getMinMax('max')?.value ?? '')}
              onChange={(e) => updateMinMax('max', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {['text', 'textarea'].includes(fieldType) && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Min Length</label>
            <input
              type="number"
              value={String(validation.find((v) => v.type === 'minLength')?.value ?? '')}
              onChange={(e) => updateMinMax('minLength', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Max Length</label>
            <input
              type="number"
              value={String(validation.find((v) => v.type === 'maxLength')?.value ?? '')}
              onChange={(e) => updateMinMax('maxLength', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Ice Depth Grid Config Editor
interface IceDepthGridConfigEditorProps {
  config: IceDepthGridConfig
  onChange: (config: IceDepthGridConfig) => void
}

function IceDepthGridConfigEditor({ config, onChange }: IceDepthGridConfigEditorProps) {
  const handlePresetChange = (preset: IceDepthGridConfig['preset']) => {
    onChange({
      ...config,
      preset,
      points: getDefaultIceDepthPoints(preset),
    })
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Ice Depth Grid
      </h4>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Preset</label>
          <select
            value={config.preset}
            onChange={(e) => handlePresetChange(e.target.value as IceDepthGridConfig['preset'])}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="RINK_25">25 Points (5x5)</option>
            <option value="RINK_35">35 Points (7x5)</option>
            <option value="RINK_47">47 Points (Full)</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Unit</label>
          <select
            value={config.unit}
            onChange={(e) => onChange({ ...config, unit: e.target.value as 'inches' | 'mm' })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="inches">Inches</option>
            <option value="mm">Millimeters</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Min Depth</label>
            <input
              type="number"
              step="0.01"
              value={config.minValue ?? ''}
              onChange={(e) => onChange({ ...config, minValue: parseFloat(e.target.value) || undefined })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Target</label>
            <input
              type="number"
              step="0.01"
              value={config.targetValue ?? ''}
              onChange={(e) => onChange({ ...config, targetValue: parseFloat(e.target.value) || undefined })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Max Depth</label>
            <input
              type="number"
              step="0.01"
              value={config.maxValue ?? ''}
              onChange={(e) => onChange({ ...config, maxValue: parseFloat(e.target.value) || undefined })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.showRinkOutline}
            onChange={(e) => onChange({ ...config, showRinkOutline: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show rink outline</span>
        </label>

        <p className="text-xs text-gray-500">
          {config.points.length} measurement points
        </p>
      </div>
    </div>
  )
}

// Body Diagram Config Editor
interface BodyDiagramConfigEditorProps {
  config: BodyDiagramConfig
  onChange: (config: BodyDiagramConfig) => void
}

function BodyDiagramConfigEditor({ config, onChange }: BodyDiagramConfigEditorProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Body Diagram
      </h4>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">View</label>
          <select
            value={config.view}
            onChange={(e) => onChange({ ...config, view: e.target.value as 'front' | 'back' | 'both' })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="front">Front Only</option>
            <option value="back">Back Only</option>
            <option value="both">Both Views</option>
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.allowMultipleMarkers}
            onChange={(e) => onChange({ ...config, allowMultipleMarkers: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Allow multiple markers</span>
        </label>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Marker Types</label>
          <div className="space-y-1">
            {config.markerTypes.map((marker, index) => (
              <div key={marker.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={marker.color}
                  onChange={(e) => {
                    const newMarkers = [...config.markerTypes]
                    newMarkers[index] = { ...marker, color: e.target.value }
                    onChange({ ...config, markerTypes: newMarkers })
                  }}
                  className="w-6 h-6 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={marker.label}
                  onChange={(e) => {
                    const newMarkers = [...config.markerTypes]
                    newMarkers[index] = { ...marker, label: e.target.value }
                    onChange({ ...config, markerTypes: newMarkers })
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    onChange({
                      ...config,
                      markerTypes: config.markerTypes.filter((_, i) => i !== index),
                    })
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              onChange({
                ...config,
                markerTypes: [
                  ...config.markerTypes,
                  {
                    id: Math.random().toString(36).substring(2, 11),
                    label: 'New Marker',
                    color: '#3b82f6',
                  },
                ],
              })
            }}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            + Add marker type
          </button>
        </div>
      </div>
    </div>
  )
}

// Calculated Field Config Editor
interface CalculatedFieldConfigEditorProps {
  config: CalculatedFieldConfig
  allFields: FormField[]
  currentFieldId: string
  onChange: (config: CalculatedFieldConfig) => void
}

function CalculatedFieldConfigEditor({
  config,
  allFields,
  currentFieldId,
  onChange,
}: CalculatedFieldConfigEditorProps) {
  // Filter to only number fields that aren't the current field
  const numberFields = allFields.filter(
    (f) => f.type === 'number' && f.id !== currentFieldId
  )

  const addFieldToFormula = (fieldId: string) => {
    onChange({
      ...config,
      formula: [...config.formula, { type: 'field', value: fieldId }],
    })
  }

  const addOperator = (op: string) => {
    onChange({
      ...config,
      formula: [...config.formula, { type: 'operator', value: op }],
    })
  }

  const addConstant = (value: number) => {
    onChange({
      ...config,
      formula: [...config.formula, { type: 'constant', value }],
    })
  }

  const addFunction = (fn: string) => {
    onChange({
      ...config,
      formula: [...config.formula, { type: 'function', value: fn }],
    })
  }

  const removeLastStep = () => {
    onChange({
      ...config,
      formula: config.formula.slice(0, -1),
    })
  }

  const clearFormula = () => {
    onChange({
      ...config,
      formula: [],
    })
  }

  const getStepDisplay = (step: CalculatedFieldConfig['formula'][number]) => {
    switch (step.type) {
      case 'field':
        const field = allFields.find((f) => f.id === step.value)
        return field ? `[${field.label}]` : '[?]'
      case 'constant':
        return String(step.value)
      case 'operator':
        return step.value
      case 'function':
        return `${step.value}()`
      default:
        return '?'
    }
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
        Calculated Field
      </h4>

      <div className="space-y-3">
        {/* Formula display */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Formula</label>
          <div className="min-h-[60px] p-2 bg-white border border-gray-300 rounded text-sm font-mono">
            {config.formula.length === 0 ? (
              <span className="text-gray-400">No formula defined</span>
            ) : (
              config.formula.map((step, i) => (
                <span key={i} className="mr-1">
                  {getStepDisplay(step)}
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={removeLastStep}
              disabled={config.formula.length === 0}
              className="text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={clearFormula}
              disabled={config.formula.length === 0}
              className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Field selector */}
        {numberFields.length > 0 && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">Add Field</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addFieldToFormula(e.target.value)
                  e.target.value = ''
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select field...</option>
              {numberFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Operators */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Operators</label>
          <div className="flex gap-1 flex-wrap">
            {['+', '-', '*', '/'].map((op) => (
              <button
                key={op}
                onClick={() => addOperator(op)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-mono"
              >
                {op}
              </button>
            ))}
          </div>
        </div>

        {/* Functions */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Functions</label>
          <div className="flex gap-1 flex-wrap">
            {['sum', 'avg', 'min', 'max', 'count'].map((fn) => (
              <button
                key={fn}
                onClick={() => addFunction(fn)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
              >
                {fn}
              </button>
            ))}
          </div>
        </div>

        {/* Constant */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Add Constant</label>
          <div className="flex gap-2">
            <input
              type="number"
              id="constant-input"
              placeholder="Value"
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => {
                const input = document.getElementById('constant-input') as HTMLInputElement
                const value = parseFloat(input.value)
                if (!isNaN(value)) {
                  addConstant(value)
                  input.value = ''
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Display settings */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Decimals</label>
            <input
              type="number"
              min="0"
              max="10"
              value={config.decimalPlaces ?? 2}
              onChange={(e) => onChange({ ...config, decimalPlaces: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Prefix</label>
            <input
              type="text"
              value={config.prefix || ''}
              onChange={(e) => onChange({ ...config, prefix: e.target.value })}
              placeholder="$"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Suffix</label>
            <input
              type="text"
              value={config.suffix || ''}
              onChange={(e) => onChange({ ...config, suffix: e.target.value })}
              placeholder="in"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
