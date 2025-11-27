'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FormTemplate {
  id: string
  moduleType: string
  name: string
  description?: string
  version: number
  isActive: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident Report',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

export default function FormsListPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModule, setSelectedModule] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/form-templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates')
      }

      setTemplates(data.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/form-templates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete template')
      }

      fetchTemplates()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const filteredTemplates = selectedModule === 'all'
    ? templates
    : templates.filter((t) => t.moduleType === selectedModule)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage report templates</p>
        </div>
        <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
          + New Template
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="input"
        >
          <option value="all">All Modules</option>
          {Object.entries(MODULE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No form templates yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first form template to get started
          </p>
          <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`card hover:shadow-lg transition-shadow ${
                !template.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    {MODULE_LABELS[template.moduleType] || template.moduleType}
                  </span>
                  {template.isLocked && (
                    <span className="ml-2 text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                      Locked
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">v{template.version}</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {template.name}
              </h3>

              {template.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="text-xs text-gray-400 mb-4">
                Updated {new Date(template.updatedAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dashboard/admin/forms/${template.id}`)}
                  className="btn btn-secondary text-sm flex-1"
                >
                  Edit
                </button>
                {!template.isLocked && (
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    className="btn btn-danger text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
