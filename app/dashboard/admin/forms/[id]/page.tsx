'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FormBuilder } from '@/components/form-builder'
import type { FormSchema } from '@/types/form-builder'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  schema: FormSchema
  isLocked: boolean
}

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/forms/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch template')
      }

      setTemplate(data.template)
      setTemplateName(data.template.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const handleSave = async (schema: FormSchema) => {
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          schema,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update template')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      throw err
    }
  }

  const handleArchive = async () => {
    if (!form) return

    if (!confirm(`Are you sure you want to archive "${form.name}"? It will no longer be available for new submissions.`)) {
      return
    }

    setIsArchiving(true)
    setError('')

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to archive form')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive form')
    } finally {
      setIsArchiving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error || 'Template not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 btn btn-secondary"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (template.isLocked) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <h3 className="font-medium">Template Locked</h3>
          <p className="mt-1 text-sm">
            This template is locked and cannot be edited. Locked templates
            contain compliance fields that must remain unchanged.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 btn btn-secondary"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-8">
      <FormBuilder
        initialSchema={template.schema}
        onSave={handleSave}
        templateName={templateName}
        onNameChange={setTemplateName}
      />
    </div>
  )
}
