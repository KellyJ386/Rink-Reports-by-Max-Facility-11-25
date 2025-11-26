'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MODULE_OPTIONS = [
  { value: 'ICE_DEPTH', label: 'Ice Depth' },
  { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
  { value: 'REFRIGERATION', label: 'Refrigeration' },
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'DAILY_CHECKLIST', label: 'Daily Checklist' },
]

export default function NewFormPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    moduleType: '',
    name: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/form-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          schema: {
            version: 1,
            fields: [],
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create template')
      }

      const template = await response.json()
      router.push(`/dashboard/admin/forms/${template.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard/admin/forms"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Forms
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Create New Form Template
        </h1>
        <p className="text-gray-600 mt-1">
          Start by selecting a module and naming your form
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.moduleType}
              onChange={(e) =>
                setFormData({ ...formData, moduleType: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a module...</option>
              {MODULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Choose which module this form template is for
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g., Standard Ice Depth Report"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description of this form template"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/admin/forms"
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.moduleType || !formData.name}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create & Edit Form'}
          </button>
        </div>
      </form>
    </div>
  )
}
