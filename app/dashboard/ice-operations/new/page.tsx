'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared'
import { UniversalHeader } from '@/components/forms'
import {
  SelectField,
  NumberField,
  TextAreaField,
  CheckboxField,
  TimeField,
} from '@/components/forms/fields'

interface Rink {
  id: string
  name: string
}

interface FormData {
  rinkId: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: string
  operationType: string
  // Ice Make fields
  waterTemp?: number
  floodCount?: number
  // Circle Check fields
  issuesFound?: boolean
  issueNotes?: string
  // Edging fields
  edgeType?: string
  boardsEdged?: boolean
  // Blade Change fields
  bladeNumber?: string
  reasonForChange?: string
  // Common fields
  notes?: string
  completedAt?: string
}

export default function NewIceOperationsPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      outsideTempUnit: 'F',
      operationType: 'ice_make',
    },
  })

  const operationType = watch('operationType')
  const issuesFound = watch('issuesFound')

  useEffect(() => {
    fetch('/api/rinks')
      .then((res) => res.json())
      .then((data) => setRinks(data.rinks || []))
      .catch(console.error)
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      // Get or create a template for ice operations
      const templateRes = await fetch('/api/forms/templates?moduleType=ICE_OPERATIONS')
      const templateData = await templateRes.json()

      let templateId = templateData.templates?.[0]?.id

      // If no template exists, we'll need one to be created in admin
      if (!templateId) {
        setError('No form template configured. Please contact admin.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: templateId,
          rinkId: data.rinkId,
          outsideTemp: data.outsideTemp,
          outsideTempUnit: data.outsideTempUnit,
          data: {
            operationType: data.operationType,
            waterTemp: data.waterTemp,
            floodCount: data.floodCount,
            issuesFound: data.issuesFound,
            issueNotes: data.issueNotes,
            edgeType: data.edgeType,
            boardsEdged: data.boardsEdged,
            bladeNumber: data.bladeNumber,
            reasonForChange: data.reasonForChange,
            notes: data.notes,
            completedAt: data.completedAt,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit')
      }

      router.push('/dashboard/ice-operations')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const operationTypes = [
    { value: 'ice_make', label: 'Ice Make / Flood' },
    { value: 'circle_check', label: 'Circle Check' },
    { value: 'edging', label: 'Edging' },
    { value: 'blade_change', label: 'Blade Change' },
  ]

  const edgeTypes = [
    { value: 'full', label: 'Full Edge' },
    { value: 'partial', label: 'Partial Edge' },
    { value: 'touch_up', label: 'Touch Up' },
  ]

  return (
    <div>
      <PageHeader
        title="New Ice Operations Report"
        backHref="/dashboard/ice-operations"
        backLabel="Back to Ice Operations"
      />

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Universal Header */}
          <UniversalHeader
            rinks={rinks}
            register={register}
            errors={errors}
            showTemperature
          />

          {/* Operation Type Selection */}
          <div className="border-t pt-6">
            <SelectField
              id="operationType"
              label="Operation Type"
              options={operationTypes}
              required
              register={register}
              error={errors.operationType}
            />
          </div>

          {/* Ice Make Fields */}
          {operationType === 'ice_make' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="col-span-full text-sm font-medium text-blue-800">Ice Make Details</h4>
              <NumberField
                id="waterTemp"
                label="Water Temperature"
                unit="°F"
                min={32}
                max={200}
                register={register}
                error={errors.waterTemp}
              />
              <NumberField
                id="floodCount"
                label="Number of Floods"
                min={1}
                max={10}
                step={1}
                register={register}
                error={errors.floodCount}
              />
            </div>
          )}

          {/* Circle Check Fields */}
          {operationType === 'circle_check' && (
            <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800">Circle Check Details</h4>
              <CheckboxField
                id="issuesFound"
                label="Issues Found"
                description="Check if any issues were discovered during the circle check"
                register={register}
                error={errors.issuesFound}
              />
              {issuesFound && (
                <TextAreaField
                  id="issueNotes"
                  label="Issue Description"
                  placeholder="Describe the issues found..."
                  required
                  rows={3}
                  register={register}
                  error={errors.issueNotes}
                />
              )}
            </div>
          )}

          {/* Edging Fields */}
          {operationType === 'edging' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Edging Details</h4>
              <SelectField
                id="edgeType"
                label="Edge Type"
                options={edgeTypes}
                required
                register={register}
                error={errors.edgeType}
              />
              <CheckboxField
                id="boardsEdged"
                label="Boards Edged"
                description="Include board edges in this edging session"
                register={register}
                error={errors.boardsEdged}
              />
            </div>
          )}

          {/* Blade Change Fields */}
          {operationType === 'blade_change' && (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800">Blade Change Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField
                  id="bladeNumber"
                  label="New Blade Number"
                  placeholder="Enter blade ID"
                  register={register}
                  error={errors.bladeNumber}
                />
                <SelectField
                  id="reasonForChange"
                  label="Reason for Change"
                  options={[
                    { value: 'scheduled', label: 'Scheduled Maintenance' },
                    { value: 'damage', label: 'Blade Damage' },
                    { value: 'performance', label: 'Performance Issue' },
                    { value: 'other', label: 'Other' },
                  ]}
                  register={register}
                  error={errors.reasonForChange}
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4 border-t pt-6">
            <TimeField
              id="completedAt"
              label="Time Completed"
              register={register}
              error={errors.completedAt}
            />
            <TextAreaField
              id="notes"
              label="Additional Notes"
              placeholder="Any additional observations or notes..."
              rows={3}
              register={register}
              error={errors.notes}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
