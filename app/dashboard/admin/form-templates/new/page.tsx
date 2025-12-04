'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FormBuilder from '@/components/forms/FormBuilder'
import { FormSchema } from '@/types/forms'

const moduleOptions = [
  { value: 'ICE_DEPTH', label: 'Ice Depth' },
  { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
  { value: 'REFRIGERATION', label: 'Refrigeration' },
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'INCIDENT', label: 'Incidents' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'DAILY_CHECKLIST', label: 'Daily Checklist' },
]

export default function NewFormTemplatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedModule = searchParams.get('module') || ''

  const [step, setStep] = useState<'info' | 'builder'>('info')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState(preselectedModule)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleStartBuilder = () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }
    if (!moduleType) {
      setError('Please select a module')
      return
    }
    setError('')
    setStep('builder')
  }

  const handleSave = async (schema: FormSchema) => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch('/api/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          moduleType,
          schema,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create template')
        return
      }

      router.push('/dashboard/admin/form-templates')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (step === 'builder') {
      setStep('info')
    } else {
      router.push('/dashboard/admin/form-templates')
    }
  }

  if (step === 'builder') {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <FormBuilder
          onSave={handleSave}
          onCancel={handleCancel}
        />
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/admin" className="hover:text-blue-600">
            Admin
          </Link>
          <span>/</span>
          <Link href="/dashboard/admin/form-templates" className="hover:text-blue-600">
            Form Templates
          </Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">New Form Template</h1>
        <p className="text-gray-600 mt-1">
          Create a new form template for a module
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="card">
          <div className="space-y-6">
            {/* Module Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module <span className="text-red-500">*</span>
              </label>
              <select
                value={moduleType}
                onChange={(e) => setModuleType(e.target.value)}
                className="input"
              >
                <option value="">Select a module...</option>
                {moduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ice Depth Report - Main Rink"
                className="input"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this template"
                rows={3}
                className="input"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBuilder}
                className="btn btn-primary"
              >
                Continue to Form Builder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
