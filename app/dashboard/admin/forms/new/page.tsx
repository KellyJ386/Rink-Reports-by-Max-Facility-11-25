'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FormBuilder from '@/components/admin/FormBuilder'
import { FieldConfig } from '@/types/forms'

const MODULE_OPTIONS = [
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
  const [step, setStep] = useState<'info' | 'builder'>('info')
  const [formInfo, setFormInfo] = useState({
    name: '',
    description: '',
    moduleType: '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formInfo.name.trim()) {
      setError('Form name is required')
      return
    }
    if (!formInfo.moduleType) {
      setError('Please select a module')
      return
    }
    setError('')
    setStep('builder')
  }

  const handleSave = async (fields: FieldConfig[]) => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formInfo.name,
          description: formInfo.description,
          moduleType: formInfo.moduleType,
          schema: { fields },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save form')
      }

      router.push(`/dashboard/admin/forms/${data.form.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form')
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (step === 'builder') {
      if (confirm('Are you sure? Any unsaved changes will be lost.')) {
        router.push('/dashboard/admin/forms')
      }
    } else {
      router.push('/dashboard/admin/forms')
    }
  }

  if (step === 'info') {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Form</h2>

        <form onSubmit={handleInfoSubmit} className="card space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Form Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formInfo.name}
              onChange={(e) => setFormInfo({ ...formInfo, name: e.target.value })}
              className="input"
              placeholder="e.g., Daily Ice Depth Report"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formInfo.description}
              onChange={(e) => setFormInfo({ ...formInfo, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Brief description of this form's purpose"
            />
          </div>

          <div>
            <label htmlFor="moduleType" className="block text-sm font-medium text-gray-700 mb-1">
              Module <span className="text-red-500">*</span>
            </label>
            <select
              id="moduleType"
              value={formInfo.moduleType}
              onChange={(e) => setFormInfo({ ...formInfo, moduleType: e.target.value })}
              className="input"
            >
              <option value="">Select a module...</option>
              {MODULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose which module this form belongs to
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Continue to Builder
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{formInfo.name}</h2>
          <p className="text-sm text-gray-500">{formInfo.description || 'No description'}</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {MODULE_OPTIONS.find((m) => m.value === formInfo.moduleType)?.label}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <FormBuilder
        moduleType={formInfo.moduleType}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
