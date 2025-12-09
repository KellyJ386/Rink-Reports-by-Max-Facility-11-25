'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormBuilder } from '@/components/form-builder'
import type { FormSchema } from '@/types/form-builder'

const MODULE_TYPES = [
  { value: 'ICE_DEPTH', label: 'Ice Depth' },
  { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
  { value: 'REFRIGERATION', label: 'Refrigeration' },
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'DAILY_CHECKLIST', label: 'Daily Checklist' },
]

export default function NewFormPage() {
  const router = useRouter()
  const [step, setStep] = useState<'config' | 'builder'>('config')
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('')
  const [error, setError] = useState('')

  const handleStartBuilding = () => {
    if (!templateName.trim()) {
      setError('Template name is required')
      return
    }
    if (!moduleType) {
      setError('Please select a module type')
      return
    }
    setError('')
    setStep('builder')
  }

  const handleSave = async (schema: FormSchema) => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: description || undefined,
          moduleType,
          schema,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template')
      }

      router.push('/dashboard/admin/forms')
    } catch (err) {
      throw err
    }
  }

  if (step === 'config') {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Form Template
        </h1>
        <p className="text-gray-600 mb-8">
          Configure the basic settings for your new form template.
        </p>

        <div className="card space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="input"
              placeholder="e.g., Ice Depth Check"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Describe the purpose of this form..."
            />
          </div>

          <div>
            <label
              htmlFor="moduleType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Module Type <span className="text-red-500">*</span>
            </label>
            <select
              id="moduleType"
              value={moduleType}
              onChange={(e) => setModuleType(e.target.value)}
              className="input"
            >
              <option value="">Select a module...</option>
              {MODULE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleStartBuilding}
              className="btn btn-primary"
            >
              Continue to Builder
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-8">
      <FormBuilder
        onSave={handleSave}
        templateName={templateName}
        onNameChange={setTemplateName}
      />
    </div>
  )
}
