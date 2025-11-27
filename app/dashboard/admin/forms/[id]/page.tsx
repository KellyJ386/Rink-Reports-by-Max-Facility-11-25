'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FormBuilder from '@/components/form-builder/FormBuilder'
import FormPreview from '@/components/form-builder/FormPreview'
import type { FormSchema } from '@/types/form-builder'

const MODULE_OPTIONS = [
  { value: 'ICE_DEPTH', label: 'Ice Depth' },
  { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
  { value: 'REFRIGERATION', label: 'Refrigeration' },
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'INCIDENT', label: 'Incident Report' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'DAILY_CHECKLIST', label: 'Daily Checklist' },
]

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditFormPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('')
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [version, setVersion] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/form-templates/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch template')
      }

      const template = data.template
      setName(template.name)
      setDescription(template.description || '')
      setModuleType(template.moduleType)
      setSchema(template.schema as FormSchema)
      setIsLocked(template.isLocked)
      setVersion(template.version)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (formSchema: FormSchema) => {
    if (!name.trim()) {
      setError('Please enter a template name')
      return
    }

    setSchema(formSchema)
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/form-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          schema: formSchema,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update template')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    if (schema) {
      setShowPreview(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !schema) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/dashboard/admin/forms" className="btn btn-primary">
          Back to Forms
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/admin/forms" className="hover:text-blue-600">
          Form Templates
        </Link>
        <span>/</span>
        <span>Edit Template</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Form Template</h1>
          <p className="text-gray-600 mt-1">
            Version {version}
            {isLocked && <span className="ml-2 text-yellow-600">(Locked)</span>}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {isLocked && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          This template is locked for compliance and cannot be modified.
        </div>
      )}

      {/* Template Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Template Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module Type
            </label>
            <select
              value={moduleType}
              disabled
              className="input w-full opacity-60"
            >
              {MODULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Cannot change module type</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="e.g., Morning Checklist"
              disabled={isLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full"
              placeholder="Optional description"
              disabled={isLocked}
            />
          </div>
        </div>
      </div>

      {/* Form Builder */}
      {schema && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Form Fields</h2>
          <FormBuilder
            initialSchema={schema}
            onSave={handleSave}
            onPreview={handlePreview}
            isLoading={isSaving}
          />
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && schema && (
        <FormPreview
          schema={schema}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
