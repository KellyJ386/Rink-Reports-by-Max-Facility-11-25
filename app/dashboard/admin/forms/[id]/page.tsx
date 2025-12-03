'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import FormBuilder from '@/components/admin/FormBuilder'
import FormPreview from '@/components/admin/FormPreview'
import { FormField } from '@/components/admin/FieldEditor'
import Badge from '@/components/ui/Badge'

interface FormTemplate {
  id: string
  moduleType: string
  name: string
  description: string | null
  version: number
  isActive: boolean
  isLocked: boolean
  schema: { fields: FormField[] }
  submissionCount: number
}

interface FormData {
  name: string
  description: string
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

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<FormTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>()

  const formName = watch('name')

  useEffect(() => {
    fetchForm()
  }, [id])

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch form')
      }
      const data = await response.json()
      setForm(data)
      setFields(data.schema?.fields || [])
      reset({
        name: data.name,
        description: data.description || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (form?.isLocked) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          schema: { fields },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update form')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const toggleActive = async () => {
    try {
      const response = await fetch(`/api/admin/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: form?.isActive ? 'deactivate' : 'activate' }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      fetchForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Form not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {form.isLocked ? 'View' : 'Edit'} Form: {form.name}
            </h2>
            {form.isLocked && (
              <Badge variant="warning">Locked</Badge>
            )}
            <Badge variant={form.isActive ? 'success' : 'default'}>
              {form.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {MODULE_LABELS[form.moduleType]} | Version {form.version} | {form.submissionCount} submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          {!form.isLocked && (
            <>
              <button
                type="button"
                onClick={toggleActive}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {form.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Publish New Version
              </button>
            </>
          )}
        </div>
      </div>

      {form.isLocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> This form is locked for compliance and cannot be modified.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Form Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Module</label>
              <p className="mt-1 text-sm text-gray-900">
                {MODULE_LABELS[form.moduleType] || form.moduleType}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Form Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Form name is required' })}
                disabled={form.isLocked}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={2}
                disabled={form.isLocked}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Form Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={showPreview ? '' : 'lg:col-span-2'}>
            {form.isLocked ? (
              <FormPreview fields={fields} title={formName || 'Form Fields'} />
            ) : (
              <FormBuilder fields={fields} onChange={setFields} />
            )}
          </div>

          {showPreview && !form.isLocked && (
            <div>
              <FormPreview fields={fields} title={formName || 'Form Preview'} />
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        {!form.isLocked && (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
