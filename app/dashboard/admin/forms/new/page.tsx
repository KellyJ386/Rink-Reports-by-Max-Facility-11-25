'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FormBuilder from '@/components/form-builder/FormBuilder'
import { FormSchema, createEmptyFormSchema, MODULE_TYPE_OPTIONS } from '@/types/form-builder'

export default function NewFormTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moduleType, setModuleType] = useState('DAILY_CHECKLIST')
  const [schema, setSchema] = useState<FormSchema>(createEmptyFormSchema())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/form-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          moduleType,
          schema: { ...schema, title: name, description }
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/dashboard/admin/forms/${data.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create template')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/admin/forms')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            <div className="border-l pl-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled Form Template"
                className="text-xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 bg-transparent w-80"
              />
              <div className="flex items-center gap-4 mt-1">
                <select
                  value={moduleType}
                  onChange={(e) => setModuleType(e.target.value)}
                  className="text-sm text-gray-500 border-none focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
                >
                  {MODULE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description..."
                  className="text-sm text-gray-500 border-none focus:outline-none focus:ring-0 bg-transparent flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
            <button
              onClick={() => router.push('/dashboard/admin/forms')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Form Builder */}
      <div className="flex-1 overflow-hidden">
        <FormBuilder
          schema={schema}
          onChange={setSchema}
        />
      </div>
    </div>
  )
}
