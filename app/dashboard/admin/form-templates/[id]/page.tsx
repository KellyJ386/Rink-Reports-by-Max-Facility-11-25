'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import FormBuilder from '@/components/forms/FormBuilder'
import FormRenderer from '@/components/forms/FormRenderer'
import { FormSchema } from '@/types/forms'

export default function EditFormTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit' | 'preview'>('view')

  // Fetch template
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/form-templates/${id}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load template')
          return
        }

        setTemplate(data.template)
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [id])

  const handleSave = async (schema: FormSchema) => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/form-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update template')
        return
      }

      setTemplate(data.template)
      setMode('view')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/form-templates/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete template')
        return
      }

      router.push('/dashboard/admin/form-templates')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const handleToggleActive = async () => {
    try {
      const response = await fetch(`/api/form-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update template')
        return
      }

      setTemplate(data.template)
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !template) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">{error}</p>
        <Link href="/dashboard/admin/form-templates" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to templates
        </Link>
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <FormBuilder
          initialSchema={template.schema}
          onSave={handleSave}
          onCancel={() => setMode('view')}
        />
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>
    )
  }

  if (mode === 'preview') {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/dashboard/admin" className="hover:text-blue-600">
                Admin
              </Link>
              <span>/</span>
              <Link href="/dashboard/admin/form-templates" className="hover:text-blue-600">
                Form Templates
              </Link>
              <span>/</span>
              <span>{template.name}</span>
              <span>/</span>
              <span>Preview</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Preview: {template.name}</h1>
          </div>
          <button
            onClick={() => setMode('view')}
            className="btn btn-secondary"
          >
            Back to Details
          </button>
        </div>

        {/* Form Preview */}
        <div className="card max-w-3xl">
          <FormRenderer
            schema={template.schema}
            onSubmit={async (data) => {
              console.log('Preview data:', data)
              alert('Form submitted (preview mode - no data saved)')
            }}
            submitButtonText="Submit (Preview)"
          />
        </div>
      </div>
    )
  }

  // View mode
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard/admin" className="hover:text-blue-600">
              Admin
            </Link>
            <span>/</span>
            <Link href="/dashboard/admin/form-templates" className="hover:text-blue-600">
              Form Templates
            </Link>
            <span>/</span>
            <span>{template.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {template.name}
            {!template.isActive && (
              <span className="ml-3 px-2 py-1 text-sm bg-gray-200 text-gray-600 rounded">
                Inactive
              </span>
            )}
            {template.isLocked && (
              <span className="ml-3 px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded">
                Locked
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            {template.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('preview')}
            className="btn btn-secondary"
          >
            Preview
          </button>
          {!template.isLocked && (
            <button
              onClick={() => setMode('edit')}
              className="btn btn-primary"
            >
              Edit Form
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Info */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Structure</h2>

            {template.schema?.sections?.map((section: any, index: number) => (
              <div key={section.id} className="mb-6 last:mb-0">
                <h3 className="font-medium text-gray-900 mb-2">
                  Section {index + 1}: {section.title}
                </h3>
                {section.description && (
                  <p className="text-sm text-gray-500 mb-2">{section.description}</p>
                )}
                <div className="space-y-2">
                  {section.fields?.map((field: any) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 text-sm py-1 px-2 bg-gray-50 rounded"
                    >
                      <span className="text-gray-400">{field.type}</span>
                      <span className="font-medium">{field.label}</span>
                      {field.validation?.required && (
                        <span className="text-red-500 text-xs">required</span>
                      )}
                    </div>
                  ))}
                  {(!section.fields || section.fields.length === 0) && (
                    <p className="text-sm text-gray-400">No fields in this section</p>
                  )}
                </div>
              </div>
            ))}

            {(!template.schema?.sections || template.schema.sections.length === 0) && (
              <p className="text-gray-500">No sections defined</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Module</dt>
                <dd className="font-medium">{template.moduleType.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Version</dt>
                <dd className="font-medium">{template.version}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium">
                  {new Date(template.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="font-medium">
                  {new Date(template.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    template.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          {!template.isLocked && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={handleToggleActive}
                  className="w-full btn btn-secondary text-sm"
                >
                  {template.isActive ? 'Deactivate' : 'Activate'} Template
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full btn btn-danger text-sm"
                >
                  Delete Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
