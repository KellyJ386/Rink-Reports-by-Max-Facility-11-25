'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared'
import { UniversalHeader } from '@/components/forms'
import { SelectField, TextAreaField } from '@/components/forms/fields'
import IceDepthGrid, { generateDefaultPoints } from '@/components/ice-depth/IceDepthGrid'

interface Rink {
  id: string
  name: string
}

interface MeasurementPoint {
  id: string
  x: number
  y: number
  label: string
  value?: number
}

interface FormData {
  rinkId: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: string
  preset: string
  notes?: string
}

export default function NewIceDepthPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [measurements, setMeasurements] = useState<MeasurementPoint[]>([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      outsideTempUnit: 'F',
      preset: '25',
    },
  })

  const preset = watch('preset') as '25' | '35' | '47'

  useEffect(() => {
    fetch('/api/rinks')
      .then((res) => res.json())
      .then((data) => setRinks(data.rinks || []))
      .catch(console.error)
  }, [])

  // Update measurement points when preset changes
  useEffect(() => {
    setMeasurements(generateDefaultPoints(preset))
  }, [preset])

  const handlePointUpdate = (pointId: string, value: number | null) => {
    setMeasurements((prev) =>
      prev.map((p) => (p.id === pointId ? { ...p, value: value ?? undefined } : p))
    )
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const templateRes = await fetch('/api/forms/templates?moduleType=ICE_DEPTH')
      const templateData = await templateRes.json()
      let templateId = templateData.templates?.[0]?.id

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
            preset: data.preset,
            measurements,
            notes: data.notes,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit')
      }

      router.push('/dashboard/ice-depth')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filledCount = measurements.filter((m) => m.value !== undefined).length

  return (
    <div>
      <PageHeader
        title="New Ice Depth Measurement"
        backHref="/dashboard/ice-depth"
        backLabel="Back to Ice Depth"
      />

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <UniversalHeader
            rinks={rinks}
            register={register}
            errors={errors}
            showTemperature
          />

          {/* Preset Selection */}
          <div className="border-t pt-6">
            <SelectField
              id="preset"
              label="Measurement Point Layout"
              options={[
                { value: '25', label: '25 Points (Standard)' },
                { value: '35', label: '35 Points (Detailed)' },
                { value: '47', label: '47 Points (Comprehensive)' },
              ]}
              required
              register={register}
              error={errors.preset}
              helperText="Select the number of measurement points for your rink"
            />
          </div>

          {/* Progress */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Measurement Progress</span>
              <span className="text-sm text-gray-600">
                {filledCount} of {measurements.length} points measured
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(filledCount / measurements.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Ice Depth Grid */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Ice Depth Measurements</h3>
            <p className="text-sm text-gray-500 mb-4">
              Click on each measurement point to enter the ice depth. Values are in inches.
            </p>
            <IceDepthGrid
              points={measurements}
              onPointUpdate={handlePointUpdate}
              unit="in"
            />
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <TextAreaField
              id="notes"
              label="Additional Notes"
              placeholder="Any observations about ice condition, problem areas, etc..."
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
              {loading ? 'Submitting...' : 'Submit Measurement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
