'use client'

import { useState, useEffect } from 'react'
import type { FormField, FieldOption, CalculatedFieldConfig, IceDepthGridConfig, BodyDiagramConfig } from '@/types/form-builder'
import ConditionalLogicBuilder from './ConditionalLogicBuilder'

interface FieldConfigPanelProps {
  field: FormField | null
  allFields: FormField[]
  onUpdate: (field: FormField) => void
  onClose: () => void
}

export default function FieldConfigPanel({ field, allFields, onUpdate, onClose }: FieldConfigPanelProps) {
  const [localField, setLocalField] = useState<FormField | null>(field)

  useEffect(() => {
    setLocalField(field)
  }, [field])

  if (!localField) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center py-8">
          Select a field to configure its properties.
        </p>
      </div>
    )
  }

  const handleChange = <K extends keyof FormField>(key: K, value: FormField[K]) => {
    const updated = { ...localField, [key]: value }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleValidationChange = (key: string, value: unknown) => {
    const updated = {
      ...localField,
      validation: {
        ...localField.validation,
        [key]: value,
      },
    }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleAddOption = () => {
    const newOption: FieldOption = {
      label: `Option ${(localField.options?.length || 0) + 1}`,
      value: `option${(localField.options?.length || 0) + 1}`,
    }
    handleChange('options', [...(localField.options || []), newOption])
  }

  const handleUpdateOption = (index: number, key: keyof FieldOption, value: string) => {
    const options = [...(localField.options || [])]
    options[index] = { ...options[index], [key]: value }
    handleChange('options', options)
  }

  const handleDeleteOption = (index: number) => {
    const options = localField.options?.filter((_, i) => i !== index) || []
    handleChange('options', options)
  }

  const hasOptions = ['select', 'multiselect', 'radio'].includes(localField.type)
  const hasMinMax = localField.type === 'number'
  const hasMinMaxLength = ['text', 'textarea', 'email', 'phone'].includes(localField.type)
  const isTemperature = localField.type === 'temperature'
  const isCalculated = localField.type === 'calculated'
  const isIceDepthGrid = localField.type === 'iceDepthGrid'
  const isBodyDiagram = localField.type === 'bodyDiagram'
  const supportsConditionalLogic = !['heading', 'paragraph', 'divider'].includes(localField.type)

  const handleCalculatedConfigChange = <K extends keyof CalculatedFieldConfig>(
    key: K,
    value: CalculatedFieldConfig[K]
  ) => {
    const updated = {
      ...localField,
      calculatedConfig: {
        ...localField.calculatedConfig,
        [key]: value,
      } as CalculatedFieldConfig,
    }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleIceDepthConfigChange = <K extends keyof IceDepthGridConfig>(
    key: K,
    value: IceDepthGridConfig[K]
  ) => {
    const updated = {
      ...localField,
      iceDepthConfig: {
        ...localField.iceDepthConfig,
        [key]: value,
      } as IceDepthGridConfig,
    }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleBodyDiagramConfigChange = <K extends keyof BodyDiagramConfig>(
    key: K,
    value: BodyDiagramConfig[K]
  ) => {
    const updated = {
      ...localField,
      bodyDiagramConfig: {
        ...localField.bodyDiagramConfig,
        [key]: value,
      } as BodyDiagramConfig,
    }
    setLocalField(updated)
    onUpdate(updated)
  }

  const handleConditionalLogicChange = (rule: typeof localField.conditionalLogic) => {
    const updated = { ...localField, conditionalLogic: rule }
    setLocalField(updated)
    onUpdate(updated)
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Field Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Field Type (read-only) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Field Type
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-700 capitalize">
            {localField.type.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>

        {/* Label */}
        <div>
          <label htmlFor="field-label" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Label
          </label>
          <input
            id="field-label"
            type="text"
            value={localField.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="input text-sm"
          />
        </div>

        {/* Field Name */}
        <div>
          <label htmlFor="field-name" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Field Name (ID)
          </label>
          <input
            id="field-name"
            type="text"
            value={localField.name}
            onChange={(e) => handleChange('name', e.target.value.replace(/\s+/g, '_').toLowerCase())}
            className="input text-sm font-mono"
          />
        </div>

        {/* Placeholder */}
        {!['checkbox', 'radio', 'heading', 'paragraph', 'divider', 'signature', 'photo'].includes(localField.type) && (
          <div>
            <label htmlFor="field-placeholder" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Placeholder
            </label>
            <input
              id="field-placeholder"
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => handleChange('placeholder', e.target.value)}
              className="input text-sm"
            />
          </div>
        )}

        {/* Help Text */}
        <div>
          <label htmlFor="field-help" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Help Text
          </label>
          <input
            id="field-help"
            type="text"
            value={localField.helpText || ''}
            onChange={(e) => handleChange('helpText', e.target.value)}
            className="input text-sm"
          />
        </div>

        {/* Width */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Width
          </label>
          <div className="flex gap-2">
            {(['full', 'half', 'third'] as const).map((width) => (
              <button
                key={width}
                onClick={() => handleChange('width', width)}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                  localField.width === width
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {width === 'full' ? '100%' : width === 'half' ? '50%' : '33%'}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Section */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Validation
          </h4>

          {/* Required */}
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={localField.validation?.required || false}
              onChange={(e) => handleValidationChange('required', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>

          {/* Min/Max for numbers */}
          {hasMinMax && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  type="number"
                  value={localField.validation?.min ?? ''}
                  onChange={(e) => handleValidationChange('min', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  type="number"
                  value={localField.validation?.max ?? ''}
                  onChange={(e) => handleValidationChange('max', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
            </div>
          )}

          {/* Min/Max Length for text */}
          {hasMinMaxLength && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Length</label>
                <input
                  type="number"
                  value={localField.validation?.minLength ?? ''}
                  onChange={(e) => handleValidationChange('minLength', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Length</label>
                <input
                  type="number"
                  value={localField.validation?.maxLength ?? ''}
                  onChange={(e) => handleValidationChange('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Options Section for select/radio/multiselect */}
        {hasOptions && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Options
              </h4>
              <button
                onClick={handleAddOption}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Add Option
              </button>
            </div>

            <div className="space-y-2">
              {localField.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1 input text-sm"
                  />
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="w-24 input text-sm font-mono"
                  />
                  <button
                    onClick={() => handleDeleteOption(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temperature Unit */}
        {isTemperature && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Temperature Settings
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <div className="flex gap-2">
                {(['F', 'C'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleChange('temperatureUnit', unit)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                      localField.temperatureUnit === unit
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    °{unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calculated Field Config */}
        {isCalculated && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Calculation Settings
            </h4>

            <div className="space-y-3">
              {/* Operation */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Operation</label>
                <select
                  value={localField.calculatedConfig?.operation || 'sum'}
                  onChange={(e) => handleCalculatedConfigChange('operation', e.target.value as CalculatedFieldConfig['operation'])}
                  className="input text-sm"
                >
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="count">Count</option>
                </select>
              </div>

              {/* Source Fields */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Source Fields</label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                  {allFields
                    .filter((f) => f.id !== localField.id && ['number', 'temperature'].includes(f.type))
                    .map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={localField.calculatedConfig?.sourceFields?.includes(f.name) || false}
                          onChange={(e) => {
                            const current = localField.calculatedConfig?.sourceFields || []
                            const updated = e.target.checked
                              ? [...current, f.name]
                              : current.filter((n) => n !== f.name)
                            handleCalculatedConfigChange('sourceFields', updated)
                          }}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs text-gray-700">{f.label}</span>
                      </label>
                    ))}
                  {allFields.filter((f) => f.id !== localField.id && ['number', 'temperature'].includes(f.type)).length === 0 && (
                    <p className="text-xs text-gray-400 px-2 py-2">No numeric fields available</p>
                  )}
                </div>
              </div>

              {/* Decimal Places */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Decimal Places</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={localField.calculatedConfig?.decimalPlaces ?? 2}
                  onChange={(e) => handleCalculatedConfigChange('decimalPlaces', Number(e.target.value))}
                  className="input text-sm"
                />
              </div>

              {/* Prefix & Suffix */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={localField.calculatedConfig?.prefix || ''}
                    onChange={(e) => handleCalculatedConfigChange('prefix', e.target.value)}
                    className="input text-sm"
                    placeholder="$"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Suffix</label>
                  <input
                    type="text"
                    value={localField.calculatedConfig?.suffix || ''}
                    onChange={(e) => handleCalculatedConfigChange('suffix', e.target.value)}
                    className="input text-sm"
                    placeholder="°F"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ice Depth Grid Config */}
        {isIceDepthGrid && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Ice Depth Grid Settings
            </h4>

            <div className="space-y-3">
              {/* Preset */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Grid Size</label>
                <select
                  value={localField.iceDepthConfig?.preset || '25'}
                  onChange={(e) => handleIceDepthConfigChange('preset', e.target.value as IceDepthGridConfig['preset'])}
                  className="input text-sm"
                >
                  <option value="25">Small (25 points - 5x5)</option>
                  <option value="35">Medium (35 points - 7x5)</option>
                  <option value="47">Large (47 points - 7x7)</option>
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit</label>
                <div className="flex gap-2">
                  {(['inches', 'mm'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => handleIceDepthConfigChange('unit', unit)}
                      className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                        localField.iceDepthConfig?.unit === unit
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Depth */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Target Depth</label>
                <input
                  type="number"
                  step="0.01"
                  value={localField.iceDepthConfig?.targetDepth ?? ''}
                  onChange={(e) => handleIceDepthConfigChange('targetDepth', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                  placeholder="e.g., 1.25"
                />
              </div>

              {/* Warning Threshold */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Warning Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  value={localField.iceDepthConfig?.warningThreshold ?? ''}
                  onChange={(e) => handleIceDepthConfigChange('warningThreshold', e.target.value ? Number(e.target.value) : undefined)}
                  className="input text-sm"
                  placeholder="e.g., 0.25"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Acceptable deviation from target
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Body Diagram Config */}
        {isBodyDiagram && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Body Diagram Settings
            </h4>

            <div className="space-y-3">
              {/* View */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">View</label>
                <select
                  value={localField.bodyDiagramConfig?.view || 'front'}
                  onChange={(e) => handleBodyDiagramConfigChange('view', e.target.value as BodyDiagramConfig['view'])}
                  className="input text-sm"
                >
                  <option value="front">Front Only</option>
                  <option value="back">Back Only</option>
                  <option value="both">Both Views</option>
                </select>
              </div>

              {/* Allow Multiple */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localField.bodyDiagramConfig?.allowMultiple !== false}
                  onChange={(e) => handleBodyDiagramConfigChange('allowMultiple', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Allow multiple markers</span>
              </label>

              {/* Injury Types */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Injury Types</label>
                <textarea
                  value={(localField.bodyDiagramConfig?.injuryTypes || ['bruise', 'cut', 'sprain', 'fracture', 'other']).join(', ')}
                  onChange={(e) => handleBodyDiagramConfigChange(
                    'injuryTypes',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )}
                  className="input text-sm"
                  rows={2}
                  placeholder="bruise, cut, sprain, fracture, other"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Comma-separated list of injury types
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conditional Logic */}
        {supportsConditionalLogic && (
          <ConditionalLogicBuilder
            rule={localField.conditionalLogic}
            availableFields={allFields}
            currentFieldId={localField.id}
            onChange={handleConditionalLogicChange}
          />
        )}
      </div>
    </div>
  )
}
