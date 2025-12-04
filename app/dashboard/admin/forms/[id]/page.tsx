'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormBuilder } from '@/components/form-builder'
import type { FormSchema } from '@/components/form-builder/types'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  isActive: boolean
  isLocked: boolean
  schema: FormSchema
  createdAt: string
  updatedAt: string
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

export default function EditFormTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const isNew = id === 'new'

  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('ICE_DEPTH')
  const [schema, setSchema] = useState<FormSchema>({
    sections: [{ id: 'section_default', title: 'General Information', fields: [] }],
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!isNew) {
      fetchTemplate()
    }
  }, [id, isNew])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/form-templates/${id}`)
      const data = await response.json()

      if (data.success) {
        setTemplate(data.data)
        setName(data.data.name)
        setDescription(data.data.description || '')
        setModuleType(data.data.moduleType)
        setSchema(data.data.schema as FormSchema)
      } else {
        setError(data.error.message)
      }
    } catch (err) {
      setError('Failed to load template')
    } finally {
      setLoading(false)
    }
  }

  const handleSchemaChange = (newSchema: FormSchema) => {
    setSchema(newSchema)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const body = {
        name: name.trim(),
        description: description.trim() || null,
        moduleType,
        schema,
      }

      let response
      if (isNew) {
        // Get facility ID (would normally come from context)
        const meResponse = await fetch('/api/auth/me')
        const meData = await meResponse.json()
        if (!meData.success) {
          throw new Error('Not authenticated')
        }

        response = await fetch('/api/form-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...body,
            facilityId: meData.data.facilityId,
          }),
        })
      } else {
        response = await fetch(`/api/form-templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const data = await response.json()

      if (data.success) {
        setHasChanges(false)
        if (isNew) {
          router.push(`/dashboard/admin/forms/${data.data.id}`)
        } else {
          setTemplate(data.data)
        }
      } else {
        setError(data.error.message)
      }
    } catch (err) {
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading template...</p>
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
            <Link
              href="/dashboard/admin/forms"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isNew ? 'Create Form Template' : 'Edit Form Template'}
              </h1>
              {template && (
                <p className="text-sm text-gray-500">
                  Version {template.version} • Last updated{' '}
                  {new Date(template.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-yellow-600">Unsaved changes</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : isNew ? 'Create Template' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Template metadata */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setHasChanges(true)
              }}
              placeholder="Template name"
              className="input w-full font-semibold text-lg"
            />
          </div>
          <div className="w-48">
            <select
              value={moduleType}
              onChange={(e) => {
                setModuleType(e.target.value)
                setHasChanges(true)
              }}
              disabled={!isNew}
              className="input w-full"
            >
              {Object.entries(moduleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-2">
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setHasChanges(true)
            }}
            placeholder="Template description (optional)"
            className="input w-full text-sm"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Form Builder */}
      <div className="flex-1 overflow-hidden p-6 bg-gray-100">
        <FormBuilder
          initialSchema={schema}
          onChange={handleSchemaChange}
        />
      </div>
    </div>
  )
}
