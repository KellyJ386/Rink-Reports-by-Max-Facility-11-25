'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared'
import { UniversalHeader } from '@/components/forms'
import {
  TextField,
  SelectField,
  TextAreaField,
  CheckboxField,
  NumberField,
} from '@/components/forms/fields'
import BodyDiagram from '@/components/incidents/BodyDiagram'

interface Rink {
  id: string
  name: string
}

interface InjuryMarker {
  id: string
  x: number
  y: number
  label: string
  description?: string
}

interface FormData {
  rinkId: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: string
  incidentType: string
  severity: string
  incidentTime: string
  locationDetail: string
  description: string
  injuredPersonName?: string
  injuredPersonPhone?: string
  injuredPersonAge?: number
  injuredPersonType: string
  ambulanceCalled: boolean
  ambulanceTime?: string
  treatmentProvided?: string
  witnessName?: string
  witnessPhone?: string
  witnessStatement?: string
  actionsTaken?: string
  followUpRequired: boolean
  notes?: string
}

export default function NewIncidentPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [injuryMarkers, setInjuryMarkers] = useState<InjuryMarker[]>([])
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      outsideTempUnit: 'F',
      incidentType: 'injury',
      severity: 'minor',
      injuredPersonType: 'patron',
      ambulanceCalled: false,
      followUpRequired: false,
    },
  })

  const incidentType = watch('incidentType')
  const ambulanceCalled = watch('ambulanceCalled')

  useEffect(() => {
    fetch('/api/rinks')
      .then((res) => res.json())
      .then((data) => setRinks(data.rinks || []))
      .catch(console.error)
  }, [])

  const handleMarkerAdd = (marker: Omit<InjuryMarker, 'id'>) => {
    const newMarker: InjuryMarker = {
      ...marker,
      id: `m${Date.now()}`,
    }
    setInjuryMarkers((prev) => [...prev, newMarker])
  }

  const handleMarkerRemove = (markerId: string) => {
    setInjuryMarkers((prev) => prev.filter((m) => m.id !== markerId))
  }

  const handleMarkerUpdate = (markerId: string, description: string) => {
    setInjuryMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, description } : m))
    )
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const templateRes = await fetch('/api/forms/templates?moduleType=INCIDENT')
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
          status: 'PENDING_REVIEW', // Incidents require review
          data: {
            incidentType: data.incidentType,
            severity: data.severity,
            incidentTime: data.incidentTime,
            locationDetail: data.locationDetail,
            description: data.description,
            injuredPerson: incidentType === 'injury' || incidentType === 'medical_emergency' ? {
              name: data.injuredPersonName,
              phone: data.injuredPersonPhone,
              age: data.injuredPersonAge,
              type: data.injuredPersonType,
            } : null,
            injuryLocations: injuryMarkers,
            ambulanceCalled: data.ambulanceCalled,
            ambulanceTime: data.ambulanceTime,
            treatmentProvided: data.treatmentProvided,
            witness: data.witnessName ? {
              name: data.witnessName,
              phone: data.witnessPhone,
              statement: data.witnessStatement,
            } : null,
            actionsTaken: data.actionsTaken,
            followUpRequired: data.followUpRequired,
            notes: data.notes,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit')
      }

      router.push('/dashboard/incidents')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showInjuryDetails = incidentType === 'injury' || incidentType === 'medical_emergency'

  return (
    <div>
      <PageHeader
        title="Report Incident"
        backHref="/dashboard/incidents"
        backLabel="Back to Incidents"
      />

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <UniversalHeader
            rinks={rinks}
            register={register}
            errors={errors}
            showTemperature={false}
          />

          {/* Incident Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Incident Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField
                id="incidentType"
                label="Incident Type"
                options={[
                  { value: 'injury', label: 'Injury' },
                  { value: 'near_miss', label: 'Near Miss' },
                  { value: 'property_damage', label: 'Property Damage' },
                  { value: 'medical_emergency', label: 'Medical Emergency' },
                  { value: 'other', label: 'Other' },
                ]}
                required
                register={register}
                error={errors.incidentType}
              />
              <SelectField
                id="severity"
                label="Severity"
                options={[
                  { value: 'minor', label: 'Minor' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'severe', label: 'Severe' },
                ]}
                required
                register={register}
                error={errors.severity}
              />
              <TextField
                id="incidentTime"
                label="Incident Time"
                placeholder="e.g., 2:30 PM"
                required
                register={register}
                error={errors.incidentTime}
              />
            </div>
            <div className="mt-4">
              <TextField
                id="locationDetail"
                label="Specific Location"
                placeholder="e.g., Center ice, penalty box, bleachers row 3"
                required
                register={register}
                error={errors.locationDetail}
              />
            </div>
            <div className="mt-4">
              <TextAreaField
                id="description"
                label="Incident Description"
                placeholder="Describe what happened in detail..."
                required
                rows={4}
                register={register}
                error={errors.description}
              />
            </div>
          </div>

          {/* Injured Person Details */}
          {showInjuryDetails && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Injured Person</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <TextField
                  id="injuredPersonName"
                  label="Name"
                  required
                  register={register}
                  error={errors.injuredPersonName}
                />
                <TextField
                  id="injuredPersonPhone"
                  label="Phone Number"
                  register={register}
                  error={errors.injuredPersonPhone}
                />
                <NumberField
                  id="injuredPersonAge"
                  label="Age"
                  min={1}
                  max={120}
                  register={register}
                  error={errors.injuredPersonAge}
                />
                <SelectField
                  id="injuredPersonType"
                  label="Person Type"
                  options={[
                    { value: 'patron', label: 'Patron/Guest' },
                    { value: 'employee', label: 'Employee' },
                    { value: 'contractor', label: 'Contractor' },
                    { value: 'participant', label: 'Participant/Player' },
                  ]}
                  register={register}
                  error={errors.injuredPersonType}
                />
              </div>

              {/* Body Diagram */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Injury Locations</h4>
                <BodyDiagram
                  markers={injuryMarkers}
                  onMarkerAdd={handleMarkerAdd}
                  onMarkerRemove={handleMarkerRemove}
                  onMarkerUpdate={handleMarkerUpdate}
                  view={bodyView}
                  onViewChange={setBodyView}
                />
              </div>
            </div>
          )}

          {/* Emergency Response */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Response</h3>
            <div className="space-y-4">
              <CheckboxField
                id="ambulanceCalled"
                label="Ambulance Called"
                description="Check if emergency medical services were contacted"
                register={register}
                error={errors.ambulanceCalled}
              />
              {ambulanceCalled && (
                <div className="ml-7 p-4 bg-red-50 rounded-lg space-y-4">
                  <TextField
                    id="ambulanceTime"
                    label="Time Ambulance Called"
                    placeholder="e.g., 2:45 PM"
                    register={register}
                    error={errors.ambulanceTime}
                  />
                </div>
              )}
              <TextAreaField
                id="treatmentProvided"
                label="First Aid / Treatment Provided"
                placeholder="Describe any first aid or treatment provided on site..."
                rows={3}
                register={register}
                error={errors.treatmentProvided}
              />
            </div>
          </div>

          {/* Witness Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Witness Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                id="witnessName"
                label="Witness Name"
                register={register}
                error={errors.witnessName}
              />
              <TextField
                id="witnessPhone"
                label="Witness Phone"
                register={register}
                error={errors.witnessPhone}
              />
            </div>
            <div className="mt-4">
              <TextAreaField
                id="witnessStatement"
                label="Witness Statement"
                placeholder="Record the witness's account of what happened..."
                rows={3}
                register={register}
                error={errors.witnessStatement}
              />
            </div>
          </div>

          {/* Follow-up */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Actions & Follow-up</h3>
            <TextAreaField
              id="actionsTaken"
              label="Actions Taken"
              placeholder="Describe what actions were taken in response..."
              rows={3}
              register={register}
              error={errors.actionsTaken}
            />
            <div className="mt-4">
              <CheckboxField
                id="followUpRequired"
                label="Follow-up Required"
                description="Check if this incident requires further follow-up or investigation"
                register={register}
                error={errors.followUpRequired}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <TextAreaField
              id="notes"
              label="Additional Notes"
              placeholder="Any other relevant information..."
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
              {loading ? 'Submitting...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
