'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SubmissionList from '@/components/forms/SubmissionList'
import FormFiller from '@/components/forms/FormFiller'
import type { FormSchema } from '@/types/form-builder'

interface IceDepthClientProps {
  canSubmit: boolean
}

interface FormTemplate {
  id: string
  name: string
  schema: FormSchema
}

interface Rink {
  id: string
  name: string
}

export default function IceDepthClient({ canSubmit }: IceDepthClientProps) {
  const router = useRouter()
  const [showNewForm, setShowNewForm] = useState(false)
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedRink, setSelectedRink] = useState<string>('')
  const [outsideTemp, setOutsideTemp] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch form templates for this module
    fetchTemplates()
    fetchRinks()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/form-templates?moduleType=ICE_DEPTH')
      const data = await response.json()
      if (response.ok && data.templates) {
        setTemplates(data.templates.filter((t: FormTemplate & { isActive: boolean }) => t.isActive))
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/rinks')
      const data = await response.json()
      if (response.ok && data.rinks) {
        setRinks(data.rinks)
        if (data.rinks.length === 1) {
          setSelectedRink(data.rinks[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch rinks:', err)
    }
  }

  const handleNewSubmission = () => {
    setShowNewForm(true)
    setError(null)
  }

  const handleCancelNew = () => {
    setShowNewForm(false)
    setSelectedTemplate('')
    setSelectedRink(rinks.length === 1 ? rinks[0].id : '')
    setOutsideTemp('')
    setError(null)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!selectedTemplate || !selectedRink) {
      setError('Please select a template and rink')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: selectedTemplate,
          rinkId: selectedRink,
          data,
          status: 'SUBMITTED',
          outsideTemp: outsideTemp ? parseFloat(outsideTemp) : undefined,
          outsideTempUnit: 'F',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit')
      }

      // Success - refresh the list
      setShowNewForm(false)
      setSelectedTemplate('')
      setSelectedRink(rinks.length === 1 ? rinks[0].id : '')
      setOutsideTemp('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async (data: Record<string, unknown>) => {
    if (!selectedTemplate || !selectedRink) {
      setError('Please select a template and rink')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: selectedTemplate,
          rinkId: selectedRink,
          data,
          status: 'DRAFT',
          outsideTemp: outsideTemp ? parseFloat(outsideTemp) : undefined,
          outsideTempUnit: 'F',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save draft')
      }

      alert('Draft saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ice Depth</h1>
          <p className="text-gray-600 mt-1">Track ice thickness at measurement points</p>
        </div>
      </div>

      {showNewForm ? (
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button
              onClick={handleCancelNew}
              className="hover:text-blue-600"
            >
              Ice Depth
            </button>
            <span>/</span>
            <span>New Reading</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">New Ice Depth Reading</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Template and Rink Selection */}
          <div className="card mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Reading Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Template *
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="input w-full"
                  disabled={isLoading}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No templates available. Create one in Admin &gt; Forms.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rink *
                </label>
                <select
                  value={selectedRink}
                  onChange={(e) => setSelectedRink(e.target.value)}
                  className="input w-full"
                  disabled={isLoading || rinks.length <= 1}
                >
                  <option value="">Select a rink...</option>
                  {rinks.map((rink) => (
                    <option key={rink.id} value={rink.id}>
                      {rink.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outside Temp (F)
                </label>
                <input
                  type="number"
                  value={outsideTemp}
                  onChange={(e) => setOutsideTemp(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., 32"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Form */}
          {selectedTemplateData?.schema ? (
            <FormFiller
              schema={selectedTemplateData.schema}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              onCancel={handleCancelNew}
              isLoading={isLoading}
              submitButtonText="Submit Reading"
            />
          ) : (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-600">Select a form template to continue</p>
            </div>
          )}
        </div>
      ) : (
        <SubmissionList
          moduleType="ICE_DEPTH"
          modulePath="ice-depth"
          onNewSubmission={canSubmit ? handleNewSubmission : undefined}
        />
      )}
    </div>
  )
}
