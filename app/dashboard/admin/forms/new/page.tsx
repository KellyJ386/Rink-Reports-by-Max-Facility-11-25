'use client'

import { useState } from 'react'
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

export default function NewFormPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('DAILY_CHECKLIST')
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = async (formSchema: FormSchema) => {
    if (!name.trim()) {
      setError('Please enter a template name')
      return
    }

    setSchema(formSchema)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType,
          name: name.trim(),
          description: description.trim() || undefined,
          schema: formSchema,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = () => {
    if (schema) {
      setShowPreview(true)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/admin/forms" className="hover:text-blue-600">
          Form Templates
        </Link>
        <span>/</span>
        <span>New Template</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Form Template</h1>
        <p className="text-gray-600 mt-1">Design a new form for your facility</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Template Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Template Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module Type *
            </label>
            <select
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value)}
              className="input w-full"
            >
              {MODULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
            />
          </div>
        </div>
      </div>

      {/* Form Builder */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Form Fields</h2>
        <FormBuilder
          onSave={handleSave}
          onPreview={schema ? handlePreview : undefined}
          isLoading={isLoading}
        />
      </div>

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
