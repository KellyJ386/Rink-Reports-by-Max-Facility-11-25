'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { FormBuilder } from '@/components/form-builder'
import { FormSchema } from '@/types'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  isActive: boolean
  isLocked: boolean
  schema: FormSchema
  conditionalRules: unknown
  calculatedFields: unknown
  _count: {
    submissions: number
  }
}

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [form, setForm] = useState<FormTemplate | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchForm()
  }, [id])

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch form')
      }
      const data = await res.json()
      setForm(data.form)
      setName(data.form.name)
      setDescription(data.form.description || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (schema: FormSchema) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          schema,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update form')
      }

      const data = await res.json()

      if (data.versioned) {
        alert(`Form has been versioned. New version: ${data.form.version}`)
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (confirm('Discard changes?')) {
      router.push('/dashboard/admin/forms')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600 mb-4">{error || 'Form not found'}</p>
        <button
          onClick={() => router.push('/dashboard/admin/forms')}
          className="btn btn-primary"
        >
          Back to Forms
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50">
      {saving && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Saving form...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 text-red-700 px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* Version warning */}
      {form._count.submissions > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center z-40">
          <span className="text-amber-800 text-sm">
            This form has {form._count.submissions} submissions. Saving changes will create a new version.
          </span>
        </div>
      )}

      <div className={form._count.submissions > 0 ? 'pt-10 h-full' : 'h-full'}>
        <FormBuilder
          initialSchema={form.schema}
          onSave={handleSave}
          onCancel={handleCancel}
          formName={name}
          onFormNameChange={setName}
          formDescription={description}
          onFormDescriptionChange={setDescription}
        />
      </div>
    </div>
  )
}
