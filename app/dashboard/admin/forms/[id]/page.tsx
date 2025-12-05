'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import FormBuilder from '@/components/form-builder/FormBuilder'
import { FormSchema, FormTemplateData, MODULE_TYPE_OPTIONS } from '@/types/form-builder'

export default function EditFormTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<FormTemplateData | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('')
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/form-templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
        setName(data.name)
        setDescription(data.description || '')
        setModuleType(data.moduleType)
        setSchema(data.schema)
      } else {
        setError('Template not found')
      }
    } catch (err) {
      setError('Failed to load template')
    } finally {
      setLoading(false)
    }
  }

  const handleSchemaChange = (newSchema: FormSchema) => {
    setSchema(newSchema)
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/form-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          schema: { ...schema, title: name, description }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
        setIsDirty(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save template')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    // First save, then publish (increment version)
    await handleSave()
    // Additional publish logic could go here
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading template...</div>
      </div>
    )
  }

  if (!template || !schema) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Template not found</h3>
          <button
            onClick={() => router.push('/dashboard/admin/forms')}
            className="text-blue-600 hover:underline"
          >
            Back to templates
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/admin/forms')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <div className="border-l pl-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setIsDirty(true) }}
                  placeholder="Untitled Form Template"
                  className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 bg-transparent w-80"
                  disabled={template.isLocked}
                />
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">
                  v{template.version}
                </span>
                {template.isLocked && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    Locked
                  </span>
                )}
                {isDirty && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-600">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500">
                  {MODULE_TYPE_OPTIONS.find(m => m.value === moduleType)?.label}
                </span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setIsDirty(true) }}
                  placeholder="Add description..."
                  className="text-sm text-gray-500 border-none focus:outline-none focus:ring-0 bg-transparent flex-1"
                  disabled={template.isLocked}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
            <button
              onClick={() => router.push('/dashboard/admin/forms')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || template.isLocked}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handlePublish}
              disabled={saving || template.isLocked}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Form Builder */}
      <div className="flex-1 overflow-hidden">
        <FormBuilder
          schema={schema}
          onChange={handleSchemaChange}
          readOnly={template.isLocked}
        />
      </div>
    </div>
  )
}
