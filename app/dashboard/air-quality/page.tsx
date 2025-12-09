'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FormRenderer from '@/components/forms/FormRenderer'
import type { FormData, UniversalHeaderData, FormSchema } from '@/types/forms'

export default function AirQualityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draft')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftData, setDraftData] = useState<FormData | null>(null)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [formTemplate, setFormTemplate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const formDataRef = useRef<FormData>({})
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Mock header data - in production this would come from the session/API
  const headerData: UniversalHeaderData = {
    userId: 'user-123',
    userName: 'John Doe',
    facilityId: 'facility-demo',
    facilityName: 'Demo Ice Arena',
    rinkId: 'rink-a',
    rinkName: 'Main Rink',
    submittedAt: new Date(),
    outsideTemp: 42,
    outsideTempUnit: 'F',
  }

  // Load form template
  useEffect(() => {
    fetchFormTemplate()
  }, [])

  // Load draft data if editing existing draft
  useEffect(() => {
    if (currentDraftId) {
      loadDraft(currentDraftId)
    }
  }, [currentDraftId])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !currentDraftId) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (Object.keys(formDataRef.current).length > 0) {
        saveDraft(formDataRef.current, true)
      }
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [formDataRef.current, autoSaveEnabled, currentDraftId])

  const fetchFormTemplate = async () => {
    try {
      const response = await fetch('/api/form-templates?moduleType=AIR_QUALITY&isActive=true')
      if (!response.ok) {
        throw new Error('Failed to fetch form template')
      }

      const result = await response.json()
      if (result.templates && result.templates.length > 0) {
        setFormTemplate(result.templates[0])
      } else {
        console.error('No active form template found for AIR_QUALITY module')
      }
    } catch (error) {
      console.error('Error fetching form template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDraft = async (id: string) => {
    try {
      const response = await fetch(`/api/submissions/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load draft')
      }

      const result = await response.json()
      const submission = result.submission

      if (submission.status !== 'DRAFT') {
        alert('This submission is not a draft and cannot be edited.')
        router.push('/dashboard/submissions')
        return
      }

      setDraftData(submission.data)
      setLastSaved(new Date(submission.updatedAt))
    } catch (error) {
      console.error('Error loading draft:', error)
      alert('Failed to load draft. Please try again.')
    }
  }

  const saveDraft = async (data: FormData, silent = false) => {
    if (!formTemplate) return

    try {
      if (!silent) setIsSavingDraft(true)

      const url = currentDraftId ? `/api/submissions/${currentDraftId}` : '/api/submissions'
      const method = currentDraftId ? 'PATCH' : 'POST'

      const body = currentDraftId
        ? {
            data,
            status: 'DRAFT',
          }
        : {
            formTemplateId: formTemplate.id,
            rinkId: headerData.rinkId,
            headerData,
            formData: data,
            status: 'DRAFT',
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const result = await response.json()
      setLastSaved(new Date())

      if (!currentDraftId && result.submission?.id) {
        setCurrentDraftId(result.submission.id)
        router.replace(`/dashboard/air-quality?draft=${result.submission.id}`)
      }

      if (!silent) {
        alert('Draft saved successfully!')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      if (!silent) {
        alert('Failed to save draft. Please try again.')
      }
    } finally {
      if (!silent) setIsSavingDraft(false)
    }
  }

  const handleFormChange = (data: FormData) => {
    formDataRef.current = data
  }

  const handleSubmit = async (data: FormData) => {
    if (!formTemplate) return

    setIsSubmitting(true)

    try {
      const url = currentDraftId ? `/api/submissions/${currentDraftId}` : '/api/submissions'
      const method = currentDraftId ? 'PATCH' : 'POST'

      const body = currentDraftId
        ? {
            data,
            status: 'SUBMITTED',
          }
        : {
            formTemplateId: formTemplate.id,
            rinkId: headerData.rinkId,
            headerData,
            formData: data,
            status: 'SUBMITTED',
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit form')
      }

      alert('Air quality report submitted successfully!')
      router.push('/dashboard/submissions')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDiscardDraft = async () => {
    if (!currentDraftId) {
      router.push('/dashboard/submissions')
      return
    }

    if (!confirm('Are you sure you want to discard this draft? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/submissions/${currentDraftId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete draft')
      }

      router.push('/dashboard/submissions')
    } catch (error) {
      console.error('Error deleting draft:', error)
      alert('Failed to discard draft. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Air Quality Monitoring</h1>
          <p className="text-wolf-600 mt-2">Monitor CO and NO2 levels for safety compliance</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading form...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!formTemplate) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Air Quality Monitoring</h1>
          <p className="text-wolf-600 mt-2">Monitor CO and NO2 levels for safety compliance</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-red-600">
            <p>No active form template found. Please contact your administrator.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-wolf-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Air Quality Monitoring</h1>
            <p className="text-wolf-600 mt-2">
              Monitor CO and NO2 levels for safety compliance
            </p>
          </div>
          {currentDraftId && (
            <div className="flex items-center gap-2">
              <Badge variant="warning">Draft</Badge>
              {lastSaved && (
                <span className="text-sm text-wolf-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Safety Alert Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Safety Critical Module</h3>
            <div className="mt-2 text-sm text-red-700">
              <p className="font-semibold">Threshold Levels:</p>
              <ul className="list-disc list-inside mt-1">
                <li>CO: Normal &lt; 9 PPM, Warning 9-35 PPM, Critical &gt; 35 PPM</li>
                <li>NO2: Normal &lt; 0.5 PPM, Warning 0.5-3 PPM, Critical &gt; 3 PPM</li>
              </ul>
              <p className="mt-2 font-semibold">
                If levels exceed critical thresholds, evacuate immediately and contact facility management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{formTemplate.name}</CardTitle>
          {formTemplate.description && (
            <p className="text-sm text-wolf-600 mt-1">{formTemplate.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div onChange={(e: any) => handleFormChange(formDataRef.current)}>
            <FormRenderer
              schema={formTemplate.schema as FormSchema}
              headerData={headerData}
              onSubmit={handleSubmit}
              defaultValues={draftData || {}}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-wolf-200">
            {currentDraftId ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscardDraft}
                  disabled={isSubmitting}
                >
                  Discard Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveDraft(formDataRef.current)}
                  disabled={isSavingDraft || isSubmitting}
                >
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  type="submit"
                  onClick={() => handleSubmit(formDataRef.current)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveDraft(formDataRef.current)}
                  disabled={isSavingDraft || isSubmitting}
                >
                  {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  type="submit"
                  onClick={() => handleSubmit(formDataRef.current)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </>
            )}
          </div>

          {/* Auto-save indicator */}
          {currentDraftId && autoSaveEnabled && (
            <div className="mt-4 text-center">
              <p className="text-xs text-wolf-500">
                Auto-save enabled - changes are saved every 30 seconds
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
