'use client'

import { useState } from 'react'
import {
  FormSchema,
  FormField,
  CalculatedFieldConfig
} from '@/types/form-builder'

interface CalculatedFieldEditorProps {
  schema: FormSchema
  field: FormField
  sectionId: string
  onUpdate: (config: CalculatedFieldConfig) => void
  onClose: () => void
}

const OPERATIONS = [
  { value: 'sum', label: 'Sum', description: 'Add all values together' },
  { value: 'average', label: 'Average', description: 'Calculate the mean value' },
  { value: 'min', label: 'Minimum', description: 'Find the smallest value' },
  { value: 'max', label: 'Maximum', description: 'Find the largest value' },
  { value: 'count', label: 'Count', description: 'Count non-empty values' }
]

export default function CalculatedFieldEditor({
  schema,
  field,
  sectionId,
  onUpdate,
  onClose
}: CalculatedFieldEditorProps) {
  const [config, setConfig] = useState<CalculatedFieldConfig>(
    field.calculatedConfig || {
      formula: '',
      sourceFields: [],
      operation: 'sum',
      decimalPlaces: 2
    }
  )

  // Get all number fields that can be used as sources
  const numberFields: { name: string; label: string }[] = []
  for (const section of schema.sections) {
    for (const f of section.fields) {
      if (f.id !== field.id && f.type === 'number') {
        numberFields.push({
          name: f.name,
          label: f.label
        })
      }
    }
  }

  const toggleSourceField = (fieldName: string) => {
    const newSourceFields = config.sourceFields.includes(fieldName)
      ? config.sourceFields.filter(f => f !== fieldName)
      : [...config.sourceFields, fieldName]

    setConfig({ ...config, sourceFields: newSourceFields })
  }

  const handleSave = () => {
    // Generate formula string for display
    const formula = `${config.operation.toUpperCase()}(${config.sourceFields.join(', ')})`
    onUpdate({ ...config, formula })
    onClose()
  }

  const getPreviewFormula = () => {
    if (config.sourceFields.length === 0) {
      return 'Select fields to calculate'
    }

    const fieldLabels = config.sourceFields.map(name => {
      const f = numberFields.find(nf => nf.name === name)
      return f?.label || name
    })

    switch (config.operation) {
      case 'sum':
        return `${fieldLabels.join(' + ')}`
      case 'average':
        return `(${fieldLabels.join(' + ')}) / ${fieldLabels.length}`
      case 'min':
        return `MIN(${fieldLabels.join(', ')})`
      case 'max':
        return `MAX(${fieldLabels.join(', ')})`
      case 'count':
        return `COUNT(${fieldLabels.join(', ')})`
      default:
        return config.formula
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Calculated Field</h2>
            <p className="text-sm text-gray-500">
              Configure calculation for &quot;{field.label}&quot;
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
          {/* Operation Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation
            </label>
            <div className="grid grid-cols-1 gap-2">
              {OPERATIONS.map(op => (
                <label
                  key={op.value}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.operation === op.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="operation"
                    value={op.value}
                    checked={config.operation === op.value}
                    onChange={(e) => setConfig({
                      ...config,
                      operation: e.target.value as CalculatedFieldConfig['operation']
                    })}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{op.label}</div>
                    <div className="text-sm text-gray-500">{op.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Source Fields Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Fields
            </label>
            {numberFields.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                <p>No number fields available</p>
                <p className="text-sm mt-1">Add number fields to the form first</p>
              </div>
            ) : (
              <div className="space-y-2">
                {numberFields.map(f => (
                  <label
                    key={f.name}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      config.sourceFields.includes(f.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.sourceFields.includes(f.name)}
                      onChange={() => toggleSourceField(f.name)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-gray-900">{f.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Decimal Places */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decimal Places
            </label>
            <select
              value={config.decimalPlaces}
              onChange={(e) => setConfig({
                ...config,
                decimalPlaces: Number(e.target.value)
              })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value={0}>0 (whole numbers)</option>
              <option value={1}>1 decimal place</option>
              <option value={2}>2 decimal places</option>
              <option value={3}>3 decimal places</option>
              <option value={4}>4 decimal places</option>
            </select>
          </div>

          {/* Formula Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Formula Preview</div>
            <div className="font-mono text-sm bg-white border rounded p-3 text-gray-600">
              {getPreviewFormula()}
            </div>
          </div>
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
            disabled={config.sourceFields.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
