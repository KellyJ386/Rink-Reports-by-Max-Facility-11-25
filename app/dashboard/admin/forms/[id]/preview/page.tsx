'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormPreview } from '@/components/form-builder/FormPreview'
import type { FormSchema } from '@/components/form-builder/types'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  schema: FormSchema
}

export default function FormPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplate()
  }, [id])

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/form-templates/${id}`)
      const data = await response.json()

      if (data.success) {
        setTemplate(data.data)
      } else {
        setError(data.error.message)
      }
    } catch {
      setError('Failed to load template')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error || 'Template not found'}</p>
          <Link href="/dashboard/admin/forms" className="btn btn-primary">
            Back to Templates
          </Link>
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
              href={`/dashboard/admin/forms/${id}`}
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
                Preview: {template.name}
              </h1>
              <p className="text-sm text-gray-500">
                Version {template.version} • {template.moduleType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/admin/forms/${id}`}
              className="btn btn-secondary"
            >
              Edit Form
            </Link>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden">
        <FormPreview
          schema={template.schema}
          onClose={() => router.push(`/dashboard/admin/forms/${id}`)}
        />
      </div>
    </div>
  )
}
