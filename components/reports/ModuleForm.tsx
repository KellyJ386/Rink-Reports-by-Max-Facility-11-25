'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UniversalHeader } from './UniversalHeader'
import { FormRenderer } from '@/components/forms/FormRenderer'
import type { FormSchema } from '@/components/form-builder/types'

interface Facility {
  id: string
  name: string
  rinks: { id: string; name: string }[]
}

interface HeaderData {
  facilityId: string
  rinkId?: string
  dateTime: string
  outsideTemp?: number
  submittedBy: { id: string; name: string }
}

type RenderProps = {
  customData: Record<string, unknown>
  setCustomData: (data: Record<string, unknown>) => void
  submitting: boolean
}

interface ModuleFormProps {
  moduleType: string
  title: string
  description: string
  basePath: string
  schema?: FormSchema
  requireRink?: boolean
  showWeather?: boolean
  children?: React.ReactNode | ((props: RenderProps) => React.ReactNode)
  onSubmit?: (data: { header: HeaderData; formData: Record<string, unknown> }) => Record<string, unknown>
}

export function ModuleForm({
  moduleType,
  title,
  description,
  basePath,
  schema,
  requireRink = true,
  showWeather = true,
  children,
  onSubmit,
}: ModuleFormProps) {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headerData, setHeaderData] = useState<HeaderData | null>(null)
  const [customData, setCustomData] = useState<Record<string, unknown>>({})

  // Mock current user
  const currentUser = { id: 'user_1', name: 'John Doe' }

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities')
      const data = await response.json()
      if (data.success) {
        setFacilities(data.data)
      }
    } catch {
      setError('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const handleHeaderChange = useCallback((data: HeaderData) => {
    setHeaderData(data)
  }, [])

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    await handleSubmit(formData)
  }

  const handleSubmit = async (formData: Record<string, unknown> = {}, asDraft = false) => {
    if (!headerData?.facilityId) {
      setError('Please select a facility')
      return
    }
    if (requireRink && !headerData?.rinkId) {
      setError('Please select a rink')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const submitData = onSubmit
        ? onSubmit({ header: headerData, formData: { ...formData, ...customData } })
        : { ...formData, ...customData, outsideTemp: headerData.outsideTemp }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType,
          facilityId: headerData.facilityId,
          rinkId: headerData.rinkId,
          status: asDraft ? 'DRAFT' : 'SUBMITTED',
          data: submitData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`${basePath}/${data.data.id}`)
      } else {
        setError(data.error?.message || 'Failed to save')
      }
    } catch {
      setError('Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={basePath} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <UniversalHeader
        facilities={facilities}
        currentUser={currentUser}
        onChange={handleHeaderChange}
        requireRink={requireRink}
        showWeather={showWeather}
        disabled={submitting}
      />

      {/* Custom children or form schema */}
      {children ? (
        <div className="space-y-6">
          {typeof children === 'function'
            ? children({ customData, setCustomData, submitting })
            : children}

          <div className="flex items-center justify-end gap-4">
            <Link href={basePath} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              onClick={() => handleSubmit({}, true)}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit({})}
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      ) : schema ? (
        <FormRenderer
          schema={schema}
          onSubmit={handleFormSubmit}
          disabled={submitting}
          submitLabel={submitting ? 'Submitting...' : 'Submit'}
        />
      ) : null}
    </div>
  )
}
