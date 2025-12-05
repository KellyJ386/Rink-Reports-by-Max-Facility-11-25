'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  ICE_DEPTH: 'bg-blue-100 text-blue-700',
  ICE_OPERATIONS: 'bg-cyan-100 text-cyan-700',
  REFRIGERATION: 'bg-purple-100 text-purple-700',
  AIR_QUALITY: 'bg-green-100 text-green-700',
  INCIDENT: 'bg-red-100 text-red-700',
  SCHEDULE: 'bg-amber-100 text-amber-700',
  DAILY_CHECKLIST: 'bg-gray-100 text-gray-700',
}

export default function FormsListPage() {
  const router = useRouter()
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms')
      if (!res.ok) {
        throw new Error('Failed to fetch forms')
      }
      const data = await res.json()
      setForms(data.forms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form template?')) {
      return
    }

    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Failed to delete form')
      }
      fetchForms()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete form')
    }
  }

  const handleToggleActive = async (form: FormTemplate) => {
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !form.isActive }),
      })
      if (!res.ok) {
        throw new Error('Failed to update form')
      }
      fetchForms()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update form')
    }
  }

  const filteredForms = forms.filter((form) => {
    if (filter === 'all') return true
    if (filter === 'active') return form.isActive
    if (filter === 'inactive') return !form.isActive
    return form.moduleType === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-8 text-center text-red-600">
        <p>{error}</p>
        <button onClick={fetchForms} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage form templates for your facility
          </p>
        </div>
        <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
          + New Template
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({forms.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Active ({forms.filter((f) => f.isActive).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Inactive ({forms.filter((f) => !f.isActive).length})
          </button>
          <div className="border-l border-gray-300 mx-2" />
          {Object.entries(moduleLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : `${moduleColors[key]} hover:opacity-80`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Forms list */}
      {filteredForms.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900">No form templates yet</h3>
          <p className="text-gray-600 mt-2 mb-6">
            Create your first form template to get started
          </p>
          <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              className={`card p-4 hover:shadow-md transition-shadow ${
                !form.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          moduleColors[form.moduleType]
                        }`}
                      >
                        {moduleLabels[form.moduleType]}
                      </span>
                      {form.version > 1 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          v{form.version}
                        </span>
                      )}
                      {!form.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                          Inactive
                        </span>
                      )}
                      {form.isLocked && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          Locked
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {form._count.submissions} submissions · Updated{' '}
                      {new Date(form.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(form)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      form.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {form.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    href={`/dashboard/admin/forms/${form.id}`}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </Link>
                  {!form.isLocked && form._count.submissions === 0 && (
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="btn btn-danger text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
