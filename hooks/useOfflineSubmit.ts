'use client'

import { useState } from 'react'
import { saveOfflineSubmission, isOnline } from '@/lib/offline'

interface SubmitOptions {
  endpoint: string
  method?: 'POST' | 'PUT'
  moduleType: string
  onSuccess?: (response: Response) => void
  onError?: (error: Error) => void
  onOfflineSave?: () => void
}

interface SubmitResult {
  success: boolean
  offline: boolean
  error?: string
}

export function useOfflineSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (
    data: Record<string, unknown>,
    options: SubmitOptions
  ): Promise<SubmitResult> => {
    setIsSubmitting(true)

    try {
      // If online, try to submit directly
      if (isOnline()) {
        const response = await fetch(options.endpoint, {
          method: options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          options.onSuccess?.(response)
          setIsSubmitting(false)
          return { success: true, offline: false }
        }

        // If server error, save offline
        if (response.status >= 500) {
          await saveOfflineSubmission({
            moduleType: options.moduleType,
            endpoint: options.endpoint,
            method: options.method || 'POST',
            data,
          })
          options.onOfflineSave?.()
          setIsSubmitting(false)
          return { success: true, offline: true }
        }

        // Client error
        const errorText = await response.text()
        options.onError?.(new Error(errorText || 'Submission failed'))
        setIsSubmitting(false)
        return { success: false, offline: false, error: errorText }
      }

      // If offline, save to IndexedDB
      await saveOfflineSubmission({
        moduleType: options.moduleType,
        endpoint: options.endpoint,
        method: options.method || 'POST',
        data,
      })
      options.onOfflineSave?.()
      setIsSubmitting(false)
      return { success: true, offline: true }

    } catch (error) {
      // Network error - save offline
      try {
        await saveOfflineSubmission({
          moduleType: options.moduleType,
          endpoint: options.endpoint,
          method: options.method || 'POST',
          data,
        })
        options.onOfflineSave?.()
        setIsSubmitting(false)
        return { success: true, offline: true }
      } catch (saveError) {
        options.onError?.(saveError as Error)
        setIsSubmitting(false)
        return { success: false, offline: false, error: (saveError as Error).message }
      }
    }
  }

  return { submit, isSubmitting }
}
