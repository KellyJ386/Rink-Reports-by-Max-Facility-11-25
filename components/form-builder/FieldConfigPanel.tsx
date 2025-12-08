'use client'

import { useState } from 'react'
import {
  FormField,
  FormSection,
  FormSchema,
  SelectOption,
  ValidationRule
} from '@/types/form-builder'

interface FieldConfigPanelProps {
  schema: FormSchema
  selectedFieldId: string | null
  selectedSectionId: string | null
  onUpdateField: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void
  onUpdateSection: (sectionId: string, updates: Partial<FormSection>) => void
  onUpdateSettings: (updates: Partial<FormSchema['settings']>) => void
}

export default function FieldConfigPanel({
  schema,
  selectedFieldId,
  selectedSectionId,
  onUpdateField,
  onUpdateSection,
  onUpdateSettings
}: FieldConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'field' | 'section' | 'form'>('field')

  // Find selected field and section
  let selectedField: FormField | null = null
  let fieldSectionId: string | null = null

  for (const section of schema.sections) {
    const field = section.fields.find(f => f.id === selectedFieldId)
    if (field) {
      selectedField = field
      fieldSectionId = section.id
      break
    }
  }

  const selectedSection = schema.sections.find(s => s.id === selectedSectionId)

  // Option editor for select/radio fields
  const [newOptionLabel, setNewOptionLabel] = useState('')

  const addOption = () => {
    if (!selectedField || !fieldSectionId || !newOptionLabel.trim()) return
    const newOption: SelectOption = {
      label: newOptionLabel.trim(),
      value: newOptionLabel.trim().toLowerCase().replace(/\s+/g, '_')
    }
    onUpdateField(fieldSectionId, selectedField.id, {
      options: [...(selectedField.options || []), newOption]
    })
    setNewOptionLabel('')
  }

  const removeOption = (index: number) => {
    if (!selectedField || !fieldSectionId) return
    const newOptions = [...(selectedField.options || [])]
    newOptions.splice(index, 1)
    onUpdateField(fieldSectionId, selectedField.id, { options: newOptions })
  }

  return (
    <div className="w-80 bg-white border-l h-full overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b sticky top-0 bg-white z-10">
        <button
          onClick={() => setActiveTab('field')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'field'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Field
        </button>
        <button
          onClick={() => setActiveTab('section')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'section'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Section
        </button>
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'form'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Form
        </button>
      </div>

      <div className="p-4">
        {/* Field Configuration */}
        {activeTab === 'field' && (
          <>
            {selectedField && fieldSectionId ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Field Properties
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded text-gray-600 mb-4">
                    {selectedField.type}
                  </span>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) =>
                      onUpdateField(fieldSectionId!, selectedField!.id, { label: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Field Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name <span className="text-gray-400">(for data)</span>
                  </label>
                  <input
                    type="text"
                    value={selectedField.name}
                    onChange={(e) =>
                      onUpdateField(fieldSectionId!, selectedField!.id, {
                        name: e.target.value.replace(/\s+/g, '_').toLowerCase()
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Placeholder */}
                {['text', 'number', 'textarea', 'select'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={selectedField.placeholder || ''}
                      onChange={(e) =>
                        onUpdateField(fieldSectionId!, selectedField!.id, { placeholder: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Help Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Help Text
                  </label>
                  <input
                    type="text"
                    value={selectedField.helpText || ''}
                    onChange={(e) =>
                      onUpdateField(fieldSectionId!, selectedField!.id, { helpText: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional help text"
                  />
                </div>

                {/* Number-specific options */}
                {selectedField.type === 'number' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min
                        </label>
                        <input
                          type="number"
                          value={selectedField.min ?? ''}
                          onChange={(e) =>
                            onUpdateField(fieldSectionId!, selectedField!.id, {
                              min: e.target.value ? Number(e.target.value) : undefined
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max
                        </label>
                        <input
                          type="number"
                          value={selectedField.max ?? ''}
                          onChange={(e) =>
                            onUpdateField(fieldSectionId!, selectedField!.id, {
                              max: e.target.value ? Number(e.target.value) : undefined
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Step
                        </label>
                        <input
                          type="number"
                          value={selectedField.step ?? ''}
                          onChange={(e) =>
                            onUpdateField(fieldSectionId!, selectedField!.id, {
                              step: e.target.value ? Number(e.target.value) : undefined
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          step="any"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={selectedField.unit || ''}
                          onChange={(e) =>
                            onUpdateField(fieldSectionId!, selectedField!.id, { unit: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="°F, inches, etc."
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Options for select/radio */}
                {['select', 'radio'].includes(selectedField.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2 mb-3">
                      {(selectedField.options || []).map((opt, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const newOptions = [...(selectedField!.options || [])]
                              newOptions[index] = {
                                ...newOptions[index],
                                label: e.target.value
                              }
                              onUpdateField(fieldSectionId!, selectedField!.id, { options: newOptions })
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <button
                            onClick={() => removeOption(index)}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOptionLabel}
                        onChange={(e) => setNewOptionLabel(e.target.value)}
                        placeholder="New option"
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && addOption()}
                      />
                      <button
                        onClick={addOption}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Width */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <select
                    value={selectedField.width || 'full'}
                    onChange={(e) =>
                      onUpdateField(fieldSectionId!, selectedField!.id, {
                        width: e.target.value as FormField['width']
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="full">Full Width</option>
                    <option value="half">Half Width</option>
                    <option value="third">One Third</option>
                    <option value="quarter">One Quarter</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-3 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedField.required}
                      onChange={(e) =>
                        onUpdateField(fieldSectionId!, selectedField!.id, { required: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedField.readOnly || false}
                      onChange={(e) =>
                        onUpdateField(fieldSectionId!, selectedField!.id, { readOnly: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Read Only</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedField.isLocked || false}
                      onChange={(e) =>
                        onUpdateField(fieldSectionId!, selectedField!.id, { isLocked: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Compliance Locked</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Select a field to configure</p>
              </div>
            )}
          </>
        )}

        {/* Section Configuration */}
        {activeTab === 'section' && (
          <>
            {selectedSection ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Section Properties
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={selectedSection.title}
                    onChange={(e) =>
                      onUpdateSection(selectedSection.id, { title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={selectedSection.description || ''}
                    onChange={(e) =>
                      onUpdateSection(selectedSection.id, { description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional section description"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSection.collapsed || false}
                    onChange={(e) =>
                      onUpdateSection(selectedSection.id, { collapsed: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Collapsed by default</span>
                </label>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Select a section to configure</p>
              </div>
            )}
          </>
        )}

        {/* Form Settings */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Form Settings
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.settings.requireSignature}
                  onChange={(e) => onUpdateSettings({ requireSignature: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Require Signature</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.settings.allowDraft}
                  onChange={(e) => onUpdateSettings({ allowDraft: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Allow Draft Saves</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.settings.allowOfflineSubmission}
                  onChange={(e) => onUpdateSettings({ allowOfflineSubmission: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Allow Offline Submission</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.settings.notifyOnSubmission}
                  onChange={(e) => onUpdateSettings({ notifyOnSubmission: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Notify on Submission</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.settings.requireApproval}
                  onChange={(e) => onUpdateSettings({ requireApproval: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Require Approval</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schema.settings.autoCalculateOnChange}
                  onChange={(e) => onUpdateSettings({ autoCalculateOnChange: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Auto-calculate Fields</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
