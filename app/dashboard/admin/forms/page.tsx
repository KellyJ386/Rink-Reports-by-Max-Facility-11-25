'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FormTemplateData, MODULE_TYPE_OPTIONS } from '@/types/form-builder'

export default function FormsListPage() {
  const [templates, setTemplates] = useState<FormTemplateData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

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
                    <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      Duplicate
                    </button>
                    <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
