'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  isActive: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  _count: {
    submissions: number
  }
}

const moduleLabels: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incidents',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

const moduleColors: Record<string, string> = {
  ICE_DEPTH: 'bg-blue-100 text-blue-800',
  ICE_OPERATIONS: 'bg-cyan-100 text-cyan-800',
  REFRIGERATION: 'bg-purple-100 text-purple-800',
  AIR_QUALITY: 'bg-green-100 text-green-800',
  INCIDENT: 'bg-red-100 text-red-800',
  SCHEDULE: 'bg-yellow-100 text-yellow-800',
  DAILY_CHECKLIST: 'bg-orange-100 text-orange-800',
}

export default function FormTemplatesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchTemplates()
  }, [filter])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('moduleType', filter)
      }

      const response = await fetch(`/api/form-templates?${params}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data.items)
      } else {
        setError(data.error.message)
      }
    } catch (err) {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage form templates for all modules
          </p>
        </div>
        <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
          Create Template
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by module:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-48"
          >
            <option value="all">All Modules</option>
            {Object.entries(moduleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            Create your first form template to get started
          </p>
          <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
            Create Template
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{template.name}</div>
                      {template.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {template.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        moduleColors[template.moduleType] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {moduleLabels[template.moduleType] || template.moduleType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    v{template.version}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {template._count.submissions}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {template.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                      {template.isLocked && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Locked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/admin/forms/${template.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/admin/forms/${template.id}/preview`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Preview
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
