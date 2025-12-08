'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FormTemplateData, MODULE_TYPE_OPTIONS } from '@/types/form-builder'

export default function FormsListPage() {
  const [templates, setTemplates] = useState<FormTemplateData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplateData | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/form-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (template: FormTemplateData) => {
    if (duplicating) return

    setDuplicating(template.id)
    try {
      const response = await fetch(`/api/form-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' })
      })

      if (response.ok) {
        const newTemplate = await response.json()
        // Refresh the list
        fetchTemplates()
        // Show success message
        alert(`Template duplicated as "${newTemplate.name}"`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to duplicate template')
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Failed to duplicate template')
    } finally {
      setDuplicating(null)
    }
  }

  const handlePreview = async (template: FormTemplateData) => {
    // Fetch full template with schema
    try {
      const response = await fetch(`/api/form-templates/${template.id}`)
      if (response.ok) {
        const fullTemplate = await response.json()
        setPreviewTemplate(fullTemplate)
      }
    } catch (error) {
      console.error('Error fetching template for preview:', error)
    }
  }

  const getModuleLabel = (moduleType: string) => {
    return MODULE_TYPE_OPTIONS.find(m => m.value === moduleType)?.label || moduleType
  }

  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.moduleType === filter)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Form Templates</h2>
          <p className="text-sm text-gray-500">Create and manage form templates for data collection</p>
        </div>
        <Link
          href="/dashboard/admin/forms/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>New Template</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex gap-1 p-2 border-b overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Templates
          </button>
          {MODULE_TYPE_OPTIONS.map((module) => (
            <button
              key={module.value}
              onClick={() => setFilter(module.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                filter === module.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {module.label}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first form template
              </p>
              <Link
                href="/dashboard/admin/forms/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>+</span>
                <span>Create Template</span>
              </Link>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        {getModuleLabel(template.moduleType)}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">
                        v{template.version}
                      </span>
                      {template.isLocked && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          Locked
                        </span>
                      )}
                      {!template.isActive && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/admin/forms/${template.id}`}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(template)}
                      disabled={duplicating === template.id}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {duplicating === template.id ? 'Duplicating...' : 'Duplicate'}
                    </button>
                    <button
                      onClick={() => handlePreview(template)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{previewTemplate.name}</h2>
                <p className="text-sm text-gray-500">{getModuleLabel(previewTemplate.moduleType)} • v{previewTemplate.version}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {previewTemplate.description && (
                <p className="text-gray-600 mb-6">{previewTemplate.description}</p>
              )}

              <h3 className="font-medium text-gray-900 mb-4">Form Fields</h3>
              <div className="space-y-4">
                {previewTemplate.schema?.sections?.map((section: { id: string; title: string; fields: Array<{ id: string; type: string; label: string; required?: boolean; placeholder?: string; options?: Array<{ label: string; value: string }> }> }, sIdx: number) => (
                  <div key={section.id || sIdx} className="border rounded-lg p-4">
                    {section.title && (
                      <h4 className="font-medium text-gray-800 mb-3">{section.title}</h4>
                    )}
                    <div className="space-y-3">
                      {section.fields?.map((field: { id: string; type: string; label: string; required?: boolean; placeholder?: string; options?: Array<{ label: string; value: string }> }, fIdx: number) => (
                        <div key={field.id || fIdx} className="flex items-start gap-3">
                          <div className="w-24 shrink-0">
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                              {field.type}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            {field.placeholder && (
                              <div className="text-sm text-gray-400">Placeholder: {field.placeholder}</div>
                            )}
                            {field.options && field.options.length > 0 && (
                              <div className="text-sm text-gray-400">
                                Options: {field.options.map((o: { label: string; value: string }) => o.label).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!previewTemplate.schema?.sections || previewTemplate.schema.sections.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No fields defined in this template</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              <Link
                href={`/dashboard/admin/forms/${previewTemplate.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Template
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
