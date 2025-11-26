'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared'
import { UniversalHeader } from '@/components/forms'
import {
  NumberField,
  SelectField,
  TextAreaField,
  CheckboxField,
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
  // Compressor readings
  compressorStatus: string
  suctionPressure?: number
  dischargePressure?: number
  oilPressure?: number
  // Temperature readings
  brineSupplyTemp?: number
  brineReturnTemp?: number
  condenserInTemp?: number
  condenserOutTemp?: number
  // Brine system
  brineLevel: string
  brinePumpStatus: string
  // Alerts
  alarmsPresent: boolean
  alarmNotes?: string
  notes?: string
}

export default function NewRefrigerationPage() {
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
      compressorStatus: 'running',
      brineLevel: 'normal',
      brinePumpStatus: 'running',
      alarmsPresent: false,
    },
  })

  const alarmsPresent = watch('alarmsPresent')

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
      const templateRes = await fetch('/api/forms/templates?moduleType=REFRIGERATION')
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
            compressorStatus: data.compressorStatus,
            suctionPressure: data.suctionPressure,
            dischargePressure: data.dischargePressure,
            oilPressure: data.oilPressure,
            brineSupplyTemp: data.brineSupplyTemp,
            brineReturnTemp: data.brineReturnTemp,
            condenserInTemp: data.condenserInTemp,
            condenserOutTemp: data.condenserOutTemp,
            brineLevel: data.brineLevel,
            brinePumpStatus: data.brinePumpStatus,
            alarmsPresent: data.alarmsPresent,
            alarmNotes: data.alarmNotes,
            notes: data.notes,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit')
      }

      router.push('/dashboard/refrigeration')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="New Refrigeration Reading"
        backHref="/dashboard/refrigeration"
        backLabel="Back to Refrigeration"
      />

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <UniversalHeader
            rinks={rinks}
            register={register}
            errors={errors}
            showTemperature
          />

          {/* Compressor Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Compressor Readings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectField
                id="compressorStatus"
                label="Compressor Status"
                options={[
                  { value: 'running', label: 'Running' },
                  { value: 'off', label: 'Off' },
                  { value: 'fault', label: 'Fault' },
                ]}
                required
                register={register}
                error={errors.compressorStatus}
              />
              <NumberField
                id="suctionPressure"
                label="Suction Pressure"
                unit="PSI"
                step={0.1}
                register={register}
                error={errors.suctionPressure}
              />
              <NumberField
                id="dischargePressure"
                label="Discharge Pressure"
                unit="PSI"
                step={0.1}
                register={register}
                error={errors.dischargePressure}
              />
              <NumberField
                id="oilPressure"
                label="Oil Pressure"
                unit="PSI"
                step={0.1}
                register={register}
                error={errors.oilPressure}
              />
            </div>
          </div>

          {/* Temperature Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Temperature Readings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <NumberField
                id="brineSupplyTemp"
                label="Brine Supply Temp"
                unit="°F"
                step={0.1}
                register={register}
                error={errors.brineSupplyTemp}
              />
              <NumberField
                id="brineReturnTemp"
                label="Brine Return Temp"
                unit="°F"
                step={0.1}
                register={register}
                error={errors.brineReturnTemp}
              />
              <NumberField
                id="condenserInTemp"
                label="Condenser In Temp"
                unit="°F"
                step={0.1}
                register={register}
                error={errors.condenserInTemp}
              />
              <NumberField
                id="condenserOutTemp"
                label="Condenser Out Temp"
                unit="°F"
                step={0.1}
                register={register}
                error={errors.condenserOutTemp}
              />
            </div>
          </div>

          {/* Brine System */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Brine System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                id="brineLevel"
                label="Brine Level"
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                required
                register={register}
                error={errors.brineLevel}
              />
              <SelectField
                id="brinePumpStatus"
                label="Brine Pump Status"
                options={[
                  { value: 'running', label: 'Running' },
                  { value: 'off', label: 'Off' },
                  { value: 'fault', label: 'Fault' },
                ]}
                required
                register={register}
                error={errors.brinePumpStatus}
              />
            </div>
          </div>

          {/* Alarms */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">System Alerts</h3>
            <div className="space-y-4">
              <CheckboxField
                id="alarmsPresent"
                label="Alarms Present"
                description="Check if any system alarms are currently active"
                register={register}
                error={errors.alarmsPresent}
              />
              {alarmsPresent && (
                <TextAreaField
                  id="alarmNotes"
                  label="Alarm Details"
                  placeholder="Describe the active alarms..."
                  required
                  rows={3}
                  register={register}
                  error={errors.alarmNotes}
                />
              )}
            </div>
          </div>

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
