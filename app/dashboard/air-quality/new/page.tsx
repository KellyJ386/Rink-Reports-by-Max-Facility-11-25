'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared'
import { UniversalHeader } from '@/components/forms'
import { NumberField, SelectField, TextAreaField, CheckboxField } from '@/components/forms/fields'
import ThresholdAlert from '@/components/air-quality/ThresholdAlert'

interface Rink {
  id: string
  name: string
}

interface FormData {
  rinkId: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: string
  coLevel: number
  no2Level: number
  measurementLocation: string
  equipmentUsed: string
  ventilationStatus: string
  actionsTaken?: string
  notes?: string
}

// Default thresholds
const CO_WARNING = 20
const CO_EVAC = 83
const NO2_WARNING = 0.3
const NO2_EVAC = 2.0

export default function NewAirQualityPage() {
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
      measurementLocation: 'rink_level',
      ventilationStatus: 'normal',
    },
  })

  const coLevel = watch('coLevel')
  const no2Level = watch('no2Level')

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
      const templateRes = await fetch('/api/forms/templates?moduleType=AIR_QUALITY')
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
            coLevel: data.coLevel,
            no2Level: data.no2Level,
            measurementLocation: data.measurementLocation,
            equipmentUsed: data.equipmentUsed,
            ventilationStatus: data.ventilationStatus,
            actionsTaken: data.actionsTaken,
            notes: data.notes,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit')
      }

      router.push('/dashboard/air-quality')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isElevated = (coLevel >= CO_WARNING) || (no2Level >= NO2_WARNING)
  const isEvacuation = (coLevel >= CO_EVAC) || (no2Level >= NO2_EVAC)

  return (
    <div>
      <PageHeader
        title="New Air Quality Reading"
        backHref="/dashboard/air-quality"
        backLabel="Back to Air Quality"
      />

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <UniversalHeader
            rinks={rinks}
            register={register}
            errors={errors}
            showTemperature
          />

          {/* Measurement Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Measurement Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                id="measurementLocation"
                label="Measurement Location"
                options={[
                  { value: 'rink_level', label: 'Rink Level (Ice Surface)' },
                  { value: 'spectator', label: 'Spectator Area' },
                  { value: 'zamboni_room', label: 'Zamboni Room' },
                  { value: 'locker_room', label: 'Locker Room' },
                  { value: 'other', label: 'Other' },
                ]}
                required
                register={register}
                error={errors.measurementLocation}
              />
              <SelectField
                id="equipmentUsed"
                label="Equipment Used"
                options={[
                  { value: 'portable_detector', label: 'Portable Gas Detector' },
                  { value: 'fixed_monitor', label: 'Fixed Monitor System' },
                  { value: 'test_tubes', label: 'Colorimetric Test Tubes' },
                ]}
                required
                register={register}
                error={errors.equipmentUsed}
              />
            </div>
          </div>

          {/* Gas Levels */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Gas Level Readings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <NumberField
                  id="coLevel"
                  label="Carbon Monoxide (CO)"
                  unit="ppm"
                  min={0}
                  max={500}
                  step={0.1}
                  required
                  register={register}
                  error={errors.coLevel}
                  helperText={`Warning: ${CO_WARNING} ppm | Evacuation: ${CO_EVAC} ppm`}
                />
                {coLevel !== undefined && coLevel > 0 && (
                  <div className="mt-3">
                    <ThresholdAlert
                      type="CO"
                      value={coLevel}
                      unit="ppm"
                      warningThreshold={CO_WARNING}
                      evacuationThreshold={CO_EVAC}
                    />
                  </div>
                )}
              </div>
              <div>
                <NumberField
                  id="no2Level"
                  label="Nitrogen Dioxide (NO₂)"
                  unit="ppm"
                  min={0}
                  max={10}
                  step={0.01}
                  required
                  register={register}
                  error={errors.no2Level}
                  helperText={`Warning: ${NO2_WARNING} ppm | Evacuation: ${NO2_EVAC} ppm`}
                />
                {no2Level !== undefined && no2Level > 0 && (
                  <div className="mt-3">
                    <ThresholdAlert
                      type="NO2"
                      value={no2Level}
                      unit="ppm"
                      warningThreshold={NO2_WARNING}
                      evacuationThreshold={NO2_EVAC}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ventilation Status */}
          <div className="border-t pt-6">
            <SelectField
              id="ventilationStatus"
              label="Ventilation System Status"
              options={[
                { value: 'normal', label: 'Normal Operation' },
                { value: 'increased', label: 'Increased Ventilation' },
                { value: 'doors_open', label: 'Doors Open for Ventilation' },
                { value: 'malfunction', label: 'System Malfunction' },
              ]}
              required
              register={register}
              error={errors.ventilationStatus}
            />
          </div>

          {/* Actions Taken (required if elevated) */}
          {isElevated && (
            <div className="border-t pt-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="font-medium text-yellow-800">
                  {isEvacuation ? '🚨 EVACUATION LEVELS DETECTED' : '⚠️ Elevated Levels Detected'}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please document actions taken in response to elevated readings.
                </p>
              </div>
              <TextAreaField
                id="actionsTaken"
                label="Actions Taken"
                placeholder="Document what actions were taken in response to elevated readings..."
                required
                rows={4}
                register={register}
                error={errors.actionsTaken}
              />
            </div>
          )}

          {/* Notes */}
          <div className="border-t pt-6">
            <TextAreaField
              id="notes"
              label="Additional Notes"
              placeholder="Any additional observations..."
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
              {loading ? 'Submitting...' : 'Submit Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
