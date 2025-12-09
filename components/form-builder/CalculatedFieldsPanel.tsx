'use client'

import { useState } from 'react'
import { FormField, CalculatedField } from '@/types'

interface CalculatedFieldsPanelProps {
  fields: FormField[]
  calculatedFields: CalculatedField[]
  onCalculatedFieldsChange: (fields: CalculatedField[]) => void
  onClose: () => void
}

function generateCalcId(): string {
  return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const formulaFunctions = [
  { name: 'sum', description: 'Add multiple values', example: 'sum(field1, field2, field3)' },
  { name: 'average', description: 'Calculate average', example: 'average(field1, field2)' },
  { name: 'min', description: 'Find minimum value', example: 'min(field1, field2)' },
  { name: 'max', description: 'Find maximum value', example: 'max(field1, field2)' },
  { name: 'count', description: 'Count non-empty values', example: 'count(field1, field2)' },
  { name: 'round', description: 'Round to decimals', example: 'round(value, 2)' },
]

export function CalculatedFieldsPanel({
  fields,
  calculatedFields,
  onCalculatedFieldsChange,
  onClose,
}: CalculatedFieldsPanelProps) {
  const [editingCalc, setEditingCalc] = useState<CalculatedField | null>(null)

  // Only number fields can be targets for calculations
  const numberFields = fields.filter((f) => f.type === 'number')

  const handleAddCalc = () => {
    if (numberFields.length < 1) {
      alert('You need at least 1 number field to create a calculated field')
      return
    }

    const newCalc: CalculatedField = {
      id: generateCalcId(),
      targetFieldId: numberFields[0].name,
      formula: '',
      sourceFieldIds: [],
    }
    setEditingCalc(newCalc)
  }

  const handleSaveCalc = (calc: CalculatedField) => {
    const existingIndex = calculatedFields.findIndex((c) => c.id === calc.id)
    if (existingIndex >= 0) {
      const updated = [...calculatedFields]
      updated[existingIndex] = calc
      onCalculatedFieldsChange(updated)
    } else {
      onCalculatedFieldsChange([...calculatedFields, calc])
    }
    setEditingCalc(null)
  }

  const handleDeleteCalc = (calcId: string) => {
    onCalculatedFieldsChange(calculatedFields.filter((c) => c.id !== calcId))
  }

  const getFieldLabel = (fieldName: string): string => {
    const field = fields.find((f) => f.name === fieldName)
    return field?.label || fieldName
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Calculated Fields</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingCalc ? (
            <CalcEditor
              calc={editingCalc}
              fields={fields}
              numberFields={numberFields}
              onSave={handleSaveCalc}
              onCancel={() => setEditingCalc(null)}
            />
          ) : (
            <>
              {/* Calculated fields list */}
              {calculatedFields.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔢</div>
                  <h3 className="text-lg font-medium text-gray-900">No calculated fields yet</h3>
                  <p className="text-gray-600 mt-2 mb-6">
                    Create formulas to automatically calculate values based on other fields
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {calculatedFields.map((calc) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-600">
                          {getFieldLabel(calc.targetFieldId)}
                        </p>
                        <p className="text-sm text-gray-600 font-mono mt-1">
                          = {calc.formula}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setEditingCalc(calc)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCalc(calc.id)}
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
                onClick={handleAddCalc}
                className="btn btn-primary w-full"
                disabled={numberFields.length < 1}
              >
                + Add Calculated Field
              </button>

              {numberFields.length < 1 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Add number fields to create calculated fields
                </p>
              )}

              {/* Help section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Available Functions</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {formulaFunctions.map((fn) => (
                    <div key={fn.name} className="text-blue-800">
                      <span className="font-mono font-medium">{fn.name}()</span>
                      <span className="text-blue-600 ml-1">- {fn.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface CalcEditorProps {
  calc: CalculatedField
  fields: FormField[]
  numberFields: FormField[]
  onSave: (calc: CalculatedField) => void
  onCancel: () => void
}

function CalcEditor({ calc, fields, numberFields, onSave, onCancel }: CalcEditorProps) {
  const [localCalc, setLocalCalc] = useState<CalculatedField>(calc)
  const [selectedSourceFields, setSelectedSourceFields] = useState<string[]>(calc.sourceFieldIds)

  const handleChange = (key: keyof CalculatedField, value: unknown) => {
    setLocalCalc((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSourceField = (fieldName: string) => {
    setSelectedSourceFields((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter((f) => f !== fieldName)
      }
      return [...prev, fieldName]
    })
  }

  const insertFieldInFormula = (fieldName: string) => {
    setLocalCalc((prev) => ({
      ...prev,
      formula: prev.formula + fieldName,
    }))
    if (!selectedSourceFields.includes(fieldName)) {
      setSelectedSourceFields((prev) => [...prev, fieldName])
    }
  }

  const insertFunction = (funcName: string) => {
    setLocalCalc((prev) => ({
      ...prev,
      formula: prev.formula + `${funcName}()`,
    }))
  }

  const handleSave = () => {
    if (!localCalc.formula.trim()) {
      alert('Please enter a formula')
      return
    }
    onSave({
      ...localCalc,
      sourceFieldIds: selectedSourceFields,
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">
        {calc.id.startsWith('calc_') ? 'New Calculated Field' : 'Edit Calculated Field'}
      </h3>

      {/* Target field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Calculate value for
        </label>
        <select
          value={localCalc.targetFieldId}
          onChange={(e) => handleChange('targetFieldId', e.target.value)}
          className="input w-full"
        >
          {numberFields.map((field) => (
            <option key={field.id} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>
      </div>

      {/* Source fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available fields (click to insert)
        </label>
        <div className="flex flex-wrap gap-2">
          {numberFields
            .filter((f) => f.name !== localCalc.targetFieldId)
            .map((field) => (
              <button
                key={field.id}
                type="button"
                onClick={() => insertFieldInFormula(field.name)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedSourceFields.includes(field.name)
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {field.label}
              </button>
            ))}
        </div>
      </div>

      {/* Functions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Functions (click to insert)
        </label>
        <div className="flex flex-wrap gap-2">
          {formulaFunctions.map((fn) => (
            <button
              key={fn.name}
              type="button"
              onClick={() => insertFunction(fn.name)}
              className="px-2 py-1 text-xs rounded border bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              title={fn.description}
            >
              {fn.name}()
            </button>
          ))}
          {['+', '-', '*', '/', '(', ')'].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => handleChange('formula', localCalc.formula + ` ${op} `)}
              className="px-3 py-1 text-xs rounded border bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 font-mono"
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Formula */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Formula
        </label>
        <input
          type="text"
          value={localCalc.formula}
          onChange={(e) => handleChange('formula', e.target.value)}
          className="input w-full font-mono text-sm"
          placeholder="e.g., sum(field1, field2) or field1 + field2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use field names, operators (+, -, *, /), and functions
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button onClick={handleSave} className="btn btn-primary flex-1">
          Save
        </button>
      </div>
    </div>
  )
}
