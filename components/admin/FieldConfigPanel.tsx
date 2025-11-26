'use client'

import { useState } from 'react'
import { FieldConfig, FieldOption } from '@/types/forms'

interface FieldConfigPanelProps {
  field: FieldConfig | undefined
  onUpdate: (updates: Partial<FieldConfig>) => void
  onClose: () => void
}

export default function FieldConfigPanel({ field, onUpdate, onClose }: FieldConfigPanelProps) {
  if (!field) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col">
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Field Settings</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-sm">Select a field to configure</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Field Settings</h3>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Settings */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Basic</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="input"
              placeholder="Field label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={field.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value || undefined })}
              className="input"
              placeholder="Optional help text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
              className="input"
              placeholder="Placeholder text"
            />
          </div>
        </div>

        {/* Validation */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Validation</h4>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>

          {/* Type-specific validation */}
          {(field.type === 'text' || field.type === 'textarea') && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Length</label>
                  <input
                    type="number"
                    value={(field as any).minLength || ''}
                    onChange={(e) => onUpdate({ minLength: e.target.value ? parseInt(e.target.value) : undefined } as any)}
                    className="input py-1 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Length</label>
                  <input
                    type="number"
                    value={(field as any).maxLength || ''}
                    onChange={(e) => onUpdate({ maxLength: e.target.value ? parseInt(e.target.value) : undefined } as any)}
                    className="input py-1 text-sm"
                    min={0}
                  />
                </div>
              </div>
            </>
          )}

          {field.type === 'number' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Value</label>
                  <input
                    type="number"
                    value={(field as any).min ?? ''}
                    onChange={(e) => onUpdate({ min: e.target.value ? parseFloat(e.target.value) : undefined } as any)}
                    className="input py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Value</label>
                  <input
                    type="number"
                    value={(field as any).max ?? ''}
                    onChange={(e) => onUpdate({ max: e.target.value ? parseFloat(e.target.value) : undefined } as any)}
                    className="input py-1 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit</label>
                <input
                  type="text"
                  value={(field as any).unit || ''}
                  onChange={(e) => onUpdate({ unit: e.target.value || undefined } as any)}
                  className="input py-1 text-sm"
                  placeholder="e.g., inches, °F, ppm"
                />
              </div>
            </>
          )}
        </div>

        {/* Options (for select, radio, multiselect) */}
        {(field.type === 'select' || field.type === 'radio' || field.type === 'multiselect') && (
          <OptionsEditor
            options={(field as any).options || []}
            onChange={(options) => onUpdate({ options } as any)}
          />
        )}

        {/* Textarea-specific */}
        {field.type === 'textarea' && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Display</h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rows</label>
              <input
                type="number"
                value={(field as any).rows || 4}
                onChange={(e) => onUpdate({ rows: parseInt(e.target.value) || 4 } as any)}
                className="input py-1 text-sm"
                min={1}
                max={20}
              />
            </div>
          </div>
        )}

        {/* Section-specific */}
        {field.type === 'section' && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Section Options</h4>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(field as any).collapsible || false}
                onChange={(e) => onUpdate({ collapsible: e.target.checked } as any)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Collapsible</span>
            </label>
            {(field as any).collapsible && (
              <label className="flex items-center gap-2 ml-6">
                <input
                  type="checkbox"
                  checked={(field as any).defaultCollapsed || false}
                  onChange={(e) => onUpdate({ defaultCollapsed: e.target.checked } as any)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Collapsed by default</span>
              </label>
            )}
          </div>
        )}

        {/* Layout */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Layout</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Width</label>
            <select
              value={field.width || 'full'}
              onChange={(e) => onUpdate({ width: e.target.value as any })}
              className="input py-1 text-sm"
            >
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">Third Width</option>
              <option value="quarter">Quarter Width</option>
            </select>
          </div>
        </div>

        {/* Advanced */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Advanced</h4>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.disabled || false}
              onChange={(e) => onUpdate({ disabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Disabled</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.hidden || false}
              onChange={(e) => onUpdate({ hidden: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Hidden by default</span>
          </label>
        </div>

        {/* Field ID (read-only) */}
        <div className="pt-3 border-t border-gray-100">
          <label className="block text-xs text-gray-400 mb-1">Field ID</label>
          <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded block truncate">
            {field.id}
          </code>
        </div>
      </div>
    </div>
  )
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[]
  onChange: (options: FieldOption[]) => void
}) {
  const addOption = () => {
    const newValue = `option${options.length + 1}`
    onChange([...options, { label: `Option ${options.length + 1}`, value: newValue }])
  }

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], ...updates }
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Options</h4>
        <button
          type="button"
          onClick={addOption}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          + Add Option
        </button>
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateOption(index, { label: e.target.value })}
              className="input py-1 text-sm flex-1"
              placeholder="Label"
            />
            <input
              type="text"
              value={option.value}
              onChange={(e) => updateOption(index, { value: e.target.value })}
              className="input py-1 text-sm w-24"
              placeholder="Value"
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="p-1 text-gray-400 hover:text-red-600"
              disabled={options.length <= 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
