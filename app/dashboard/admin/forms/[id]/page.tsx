'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import FormBuilder from '@/components/admin/FormBuilder'
import FormPreview from '@/components/admin/FormPreview'
import { FieldConfig } from '@/types/forms'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  isActive: boolean
  isLocked: boolean
  schema: { fields: FieldConfig[] }
  createdAt: string
  updatedAt: string
}

const MODULE_LABELS: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incidents',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

export default function FormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string

  const [form, setForm] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'view' | 'edit' | 'preview'>('view')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchForm()
  }, [formId])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load form')
      }

      setForm(data.form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (fields: FieldConfig[]) => {
    if (!form) return

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          schema: { fields },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save form')
      }

      // If a new version was created, redirect to it
      if (data.newVersion && data.form) {
        router.push(`/dashboard/admin/forms/${data.form.id}`)
      } else {
        setForm(data.form)
        setMode('view')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading form...</div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="card text-center py-12">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Form</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/dashboard/admin/forms" className="btn btn-secondary">
          Back to Forms
        </Link>
      </div>
    )
  }

  if (!form) return null

  // Preview mode
  if (mode === 'preview') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Preview: {form.name}</h2>
            <p className="text-sm text-gray-500">See how the form will appear to users</p>
          </div>
          <button onClick={() => setMode('view')} className="btn btn-secondary">
            Exit Preview
          </button>
        </div>
        <FormPreview fields={form.schema.fields} formName={form.name} />
      </div>
    )
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Editing: {form.name}</h2>
            <p className="text-sm text-gray-500">v{form.version}</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {MODULE_LABELS[form.moduleType] || form.moduleType}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <FormBuilder
          initialFields={form.schema.fields}
          moduleType={form.moduleType}
          onSave={handleSave}
          onCancel={() => setMode('view')}
        />
      </div>
    )
  }

  // View mode (default)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/forms"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{form.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                v{form.version}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {MODULE_LABELS[form.moduleType] || form.moduleType}
              </span>
              {form.isLocked && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode('preview')} className="btn btn-secondary">
            Preview
          </button>
          {!form.isLocked && (
            <button onClick={() => setMode('edit')} className="btn btn-primary">
              Edit Form
            </button>
          )}
        </div>
      </div>

      {form.description && (
        <p className="text-gray-600 mb-6">{form.description}</p>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Fields</div>
          <div className="text-2xl font-semibold">{form.schema.fields.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Created</div>
          <div className="text-sm font-medium">{new Date(form.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Last Updated</div>
          <div className="text-sm font-medium">{new Date(form.updatedAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Fields ({form.schema.fields.length})</h3>
        {form.schema.fields.length === 0 ? (
          <p className="text-gray-500 text-sm">No fields defined yet.</p>
        ) : (
          <div className="space-y-2">
            {form.schema.fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                <span className="font-medium text-gray-900">{field.label}</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                  {field.type}
                </span>
                {field.required && (
                  <span className="text-red-500 text-xs">Required</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
