'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FormRenderer from '@/components/forms/FormRenderer'
import {
  iceMakeFormSchema,
  circleCheckFormSchema,
  edgingFormSchema,
  bladeChangeFormSchema,
} from '@/lib/sample-forms'
import type { FormData, UniversalHeaderData } from '@/types/forms'

export default function IceOperationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draft') // For loading existing drafts

  const [activeTab, setActiveTab] = useState('ice-make')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftData, setDraftData] = useState<FormData | null>(null)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
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

  const tabs = [
    { id: 'ice-make', label: 'Ice Make', icon: '💧' },
    { id: 'circle-check', label: 'Circle Check', icon: '✓' },
    { id: 'edging', label: 'Edging', icon: '✂️' },
    { id: 'blade-change', label: 'Blade Change', icon: '🔧' },
  ]

  // Load draft data if editing existing draft
  useEffect(() => {
    if (currentDraftId) {
      loadDraft(currentDraftId)
    }
  }, [currentDraftId])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !currentDraftId) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set up new auto-save timer (save every 30 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      if (Object.keys(formDataRef.current).length > 0) {
        saveDraft(formDataRef.current, true) // true = silent auto-save
      }
    }, 30000) // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [formDataRef.current, autoSaveEnabled, currentDraftId])

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
      formDataRef.current = submission.data
      setLastSaved(new Date(submission.submittedAt))
    } catch (error) {
      console.error('Error loading draft:', error)
      alert('Failed to load draft. Please try again.')
      router.push('/dashboard/ice-operations')
    }
  }

  const saveDraft = async (data: FormData, silent = false) => {
    if (!silent) setIsSavingDraft(true)

    try {
      const url = currentDraftId
        ? `/api/submissions/${currentDraftId}`
        : '/api/submissions'

      const method = currentDraftId ? 'PATCH' : 'POST'

      const body = currentDraftId
        ? { data, status: 'DRAFT' }
        : {
            formTemplateId: iceMakeFormSchema.id,
            rinkId: headerData.rinkId,
            headerData,
            formData: data,
            status: 'DRAFT',
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save draft')
      }

      // Set the draft ID if this is a new draft
      if (!currentDraftId && result.submission?.id) {
        setCurrentDraftId(result.submission.id)
        // Update URL to include draft ID
        router.replace(`/dashboard/ice-operations?draft=${result.submission.id}`)
      }

      setLastSaved(new Date())

      if (!silent) {
        alert('Draft saved successfully!')
      }
    } catch (error) {
      console.error('Save draft error:', error)
      if (!silent) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error saving draft'
        alert(`${errorMessage}. Please try again.`)
      }
    } finally {
      if (!silent) setIsSavingDraft(false)
    }
  }

  const handleSaveDraft = () => {
    saveDraft(formDataRef.current, false)
  }

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      // If editing a draft, update it to SUBMITTED status
      if (currentDraftId) {
        const response = await fetch(`/api/submissions/${currentDraftId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data,
            status: 'SUBMITTED',
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit form')
        }

        alert('Draft submitted successfully!')
        router.push(`/dashboard/submissions/${currentDraftId}`)
      } else {
        // Create new submission
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formTemplateId: iceMakeFormSchema.id,
            rinkId: headerData.rinkId,
            headerData,
            formData: data,
            status: 'SUBMITTED',
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit form')
        }

        alert('Form submitted successfully!')
        router.push(`/dashboard/submissions/${result.submission.id}`)
      }
    } catch (error) {
      console.error('Submit error:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Error submitting form'
      alert(`${errorMessage}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormChange = (data: FormData) => {
    formDataRef.current = data
  }

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never'
    const now = new Date()
    const diff = now.getTime() - lastSaved.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 60) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`
    return lastSaved.toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-wolf-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-navy">Ice Operations</h1>
              {currentDraftId && (
                <Badge variant="warning">
                  Editing Draft
                </Badge>
              )}
            </div>
            <p className="text-wolf-600 mt-2">
              Track ice make, circle check, edging, and blade changes
            </p>
          </div>
          {currentDraftId && (
            <div className="text-right text-sm">
              <div className="text-wolf-600">
                {autoSaveEnabled ? '🟢 Auto-save enabled' : '⚪ Auto-save disabled'}
              </div>
              <div className="text-wolf-500">
                Last saved: {formatLastSaved()}
              </div>
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className="text-xs text-action-green-600 hover:underline mt-1"
              >
                {autoSaveEnabled ? 'Disable' : 'Enable'} auto-save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />

      {/* Ice Make Tab */}
      <TabsContent value="ice-make" activeValue={activeTab}>
        <FormRenderer
          schema={iceMakeFormSchema}
          headerData={headerData}
          onSubmit={handleSubmit}
          defaultValues={draftData || undefined}
          isSubmitting={isSubmitting}
        />

        <div className="flex justify-between items-center mt-6">
          <div className="flex gap-2">
            {currentDraftId && (
              <Button
                variant="ghost"
                type="button"
                disabled={isSubmitting || isSavingDraft}
                onClick={() => {
                  if (confirm('Are you sure you want to discard this draft?')) {
                    router.push('/dashboard/ice-operations')
                  }
                }}
              >
                Discard Draft
              </Button>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting || isSavingDraft}
              onClick={() => router.push('/dashboard/submissions')}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              type="button"
              disabled={isSubmitting || isSavingDraft}
              onClick={handleSaveDraft}
              className="border border-wolf-300"
            >
              {isSavingDraft ? 'Saving...' : '💾 Save as Draft'}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              onClick={() => {
                // Trigger form submission
                const form = document.querySelector('form')
                if (form) {
                  form.requestSubmit()
                }
              }}
            >
              {isSubmitting
                ? 'Submitting...'
                : currentDraftId
                ? 'Submit Draft'
                : 'Submit Report'}
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Circle Check Tab */}
      <TabsContent value="circle-check" activeValue={activeTab}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-navy mb-2">
              Circle Check
            </h2>
            <p className="text-wolf-600">
              Pre-shift inspection checklist
            </p>
            <p className="text-sm text-wolf-400 mt-4">
              Form schema coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Edging Tab */}
      <TabsContent value="edging" activeValue={activeTab}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✂️</div>
            <h2 className="text-xl font-semibold text-navy mb-2">
              Edging Report
            </h2>
            <p className="text-wolf-600">
              Track edging activities and blade condition
            </p>
            <p className="text-sm text-wolf-400 mt-4">
              Form schema coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Blade Change Tab */}
      <TabsContent value="blade-change" activeValue={activeTab}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-xl font-semibold text-navy mb-2">
              Blade Change Log
            </h2>
            <p className="text-wolf-600">
              Track blade changes and maintenance
            </p>
            <p className="text-sm text-wolf-400 mt-4">
              Form schema coming soon
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  )
}
