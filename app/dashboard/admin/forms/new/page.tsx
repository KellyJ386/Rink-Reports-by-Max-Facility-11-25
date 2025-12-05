'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormBuilder } from '@/components/form-builder'
import { FormSchema } from '@/types'

const moduleOptions = [
  { value: 'ICE_DEPTH', label: 'Ice Depth' },
  { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
  { value: 'REFRIGERATION', label: 'Refrigeration' },
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'INCIDENT', label: 'Incidents' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'DAILY_CHECKLIST', label: 'Daily Checklist' },
]

export default function NewFormPage() {
  const router = useRouter()
  const [step, setStep] = useState<'config' | 'builder'>('config')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartBuilder = () => {
    if (!name.trim()) {
      setError('Please enter a form name')
      return
    }
    if (!moduleType) {
      setError('Please select a module type')
      return
    }
    setError(null)
    setStep('builder')
  }

  const handleSave = async (schema: FormSchema) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          moduleType,
          schema,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create form')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (step === 'builder') {
      if (confirm('Discard changes and go back?')) {
        setStep('config')
      }
    } else {
      router.push('/dashboard/admin/forms')
    }
  }

  if (step === 'config') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Form Template</h1>
          <p className="text-gray-600 mt-1">
            Configure your new form template
          </p>
        </div>

        <div className="card p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Daily Ice Depth Report"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this form..."
              rows={3}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Type *
            </label>
            <select
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value)}
              className="input w-full"
            >
              <option value="">Select a module...</option>
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              This determines which module the form will appear in
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleStartBuilder}
              className="btn btn-primary flex-1"
            >
              Continue to Builder
            </button>
          </div>
        </div>
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
      <FormBuilder
        onSave={handleSave}
        onCancel={handleCancel}
        formName={name}
        onFormNameChange={setName}
        formDescription={description}
        onFormDescriptionChange={setDescription}
      />
    </div>
  )
}
