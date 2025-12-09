'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface FormTemplate {
  id: string
  moduleType: string
  name: string
  description: string | null
  version: number
  isActive: boolean
  isLocked: boolean
  createdAt: string
  submissionCount: number
}

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

export default function FormsPage() {
  const router = useRouter()
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteForm, setDeleteForm] = useState<FormTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [moduleFilter, setModuleFilter] = useState('')

  useEffect(() => {
    fetchForms()
  }, [moduleFilter])

  const fetchForms = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (moduleFilter) params.set('moduleType', moduleFilter)

      const response = await fetch(`/api/admin/forms?${params}`)
      if (response.ok) {
        const data = await response.json()
        setForms(data.forms)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteForm) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/forms/${deleteForm.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchForms()
      }
    } catch (error) {
      console.error('Error deleting form:', error)
    } finally {
      setIsDeleting(false)
      setDeleteForm(null)
    }
  }

  // Group forms by module type
  const groupedForms = forms.reduce((acc, form) => {
    const module = form.moduleType
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(form)
    return acc
  }, {} as Record<string, FormTemplate[]>)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Form Templates</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage custom forms for data collection
          </p>
        </div>
        <Link
          href="/dashboard/admin/forms/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Form
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by module:</label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Modules</option>
            {Object.entries(MODULE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Forms List */}
      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new form template.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/admin/forms/new"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Form
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedForms).map(([moduleType, moduleForms]) => (
            <div key={moduleType}>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                {MODULE_LABELS[moduleType] || moduleType}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleForms.map((form) => (
                  <div
                    key={form.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/admin/forms/${form.id}`)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {form.name}
                            </h4>
                            {form.isLocked && (
                              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {form.description || 'No description'}
                          </p>
                        </div>
                        <Badge variant={form.isActive ? 'success' : 'default'} size="sm">
                          {form.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>v{form.version}</span>
                        <span>{form.submissionCount} submissions</span>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/admin/forms/${form.id}`)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {!form.isLocked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteForm(form)
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteForm}
        onClose={() => setDeleteForm(null)}
        onConfirm={handleDelete}
        title="Archive Form"
        message={`Are you sure you want to archive "${deleteForm?.name}"? It will no longer be available for new submissions but existing data will be preserved.`}
        confirmText="Archive"
        variant="warning"
        isLoading={isDeleting}
      />
    </div>
  )
}
