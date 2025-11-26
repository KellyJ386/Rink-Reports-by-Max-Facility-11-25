'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FormBuilder } from '@/components/form-builder'
import { FormSchema, FormTemplateResponse } from '@/types/form-builder'

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

export default function FormEditorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [template, setTemplate] = useState<FormTemplateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Fetch template
  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await fetch(`/api/form-templates/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch template')
        }
        const data = await response.json()
        setTemplate(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [id])

  // Save template
  const handleSave = async (schema: FormSchema) => {
    setIsSaving(true)
    setSaveMessage('')
    setError('')

    try {
      const response = await fetch(`/api/form-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save template')
      }

      const updatedTemplate = await response.json()
      setTemplate(updatedTemplate)
      setSaveMessage('Saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete template
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) {
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

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading form template...</div>
      </div>
    )
  }

  if (error && !template) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <Link
            href="/dashboard/admin/forms"
            className="mt-4 inline-block text-red-600 hover:text-red-700"
          >
            ← Back to Forms
          </Link>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="h-full flex flex-col -m-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/admin/forms"
              className="text-gray-400 hover:text-gray-600"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {template.name}
              </h1>
              <p className="text-sm text-gray-500">
                {MODULE_LABELS[template.moduleType]} • v{template.version}
                {template.isLocked && ' • 🔒 Locked'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-sm text-green-600">{saveMessage}</span>
            )}
            {error && <span className="text-sm text-red-600">{error}</span>}

            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isPreviewMode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isPreviewMode ? 'Edit Mode' : 'Preview'}
            </button>

            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Form Builder */}
      <div className="flex-1 overflow-hidden">
        <FormBuilder
          initialSchema={template.schema}
          onSave={handleSave}
          isPreviewMode={isPreviewMode}
        />
      </div>

      {/* Saving overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
            Saving...
          </div>
        </div>
      )}
    </div>
  )
}
