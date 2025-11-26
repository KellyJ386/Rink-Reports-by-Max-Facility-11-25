'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared'
import { UniversalHeader } from '@/components/forms'
import { SelectField, TextAreaField } from '@/components/forms/fields'

interface Rink {
  id: string
  name: string
}

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  notes?: string
}

interface FormData {
  rinkId: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: string
  checklistType: string
  notes?: string
}

// Default checklist items by type
const defaultItems: Record<string, { id: string; label: string }[]> = {
  opening: [
    { id: 'lights', label: 'Turn on facility lights' },
    { id: 'hvac', label: 'Check HVAC system' },
    { id: 'ice_inspect', label: 'Inspect ice surface condition' },
    { id: 'boards', label: 'Check boards and glass' },
    { id: 'goals', label: 'Set up goals and nets' },
    { id: 'zamboni', label: 'Pre-check Zamboni' },
    { id: 'first_aid', label: 'Verify first aid kit stocked' },
    { id: 'aed', label: 'Check AED battery indicator' },
    { id: 'exits', label: 'Verify emergency exits clear' },
    { id: 'restrooms', label: 'Check restroom supplies' },
  ],
  closing: [
    { id: 'final_flood', label: 'Complete final ice flood' },
    { id: 'zamboni_park', label: 'Park and clean Zamboni' },
    { id: 'locker_check', label: 'Check all locker rooms' },
    { id: 'lost_found', label: 'Collect lost and found items' },
    { id: 'trash', label: 'Empty trash receptacles' },
    { id: 'hvac_adjust', label: 'Adjust HVAC for overnight' },
    { id: 'lights_off', label: 'Turn off unnecessary lights' },
    { id: 'doors_locked', label: 'Secure all doors' },
    { id: 'alarm_set', label: 'Set security alarm' },
    { id: 'incident_log', label: 'Review incident log' },
  ],
  shift_change: [
    { id: 'handoff', label: 'Brief incoming operator' },
    { id: 'ice_status', label: 'Report ice surface status' },
    { id: 'equipment', label: 'Report equipment status' },
    { id: 'incidents', label: 'Report any incidents' },
    { id: 'schedule', label: 'Review upcoming events' },
    { id: 'supplies', label: 'Check supply levels' },
  ],
}

export default function NewChecklistPage() {
  const router = useRouter()
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      outsideTempUnit: 'F',
      checklistType: 'opening',
    },
  })

  const checklistType = watch('checklistType')

  useEffect(() => {
    fetch('/api/rinks')
      .then((res) => res.json())
      .then((data) => setRinks(data.rinks || []))
      .catch(console.error)
  }, [])

  // Update items when checklist type changes
  useEffect(() => {
    const defaults = defaultItems[checklistType] || defaultItems.opening
    setItems(defaults.map((item) => ({ ...item, checked: false, notes: '' })))
  }, [checklistType])

  const toggleItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      )
    )
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const templateRes = await fetch('/api/forms/templates?moduleType=DAILY_CHECKLIST')
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
            checklistType: data.checklistType,
            items,
            notes: data.notes,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to submit')
      }

      router.push('/dashboard/checklists')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = items.filter((i) => i.checked).length
  const totalCount = items.length
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div>
      <PageHeader
        title="New Daily Checklist"
        backHref="/dashboard/checklists"
        backLabel="Back to Checklists"
      />

      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <UniversalHeader
            rinks={rinks}
            register={register}
            errors={errors}
            showTemperature
          />

          {/* Checklist Type */}
          <div className="border-t pt-6">
            <SelectField
              id="checklistType"
              label="Checklist Type"
              options={[
                { value: 'opening', label: 'Opening Checklist' },
                { value: 'closing', label: 'Closing Checklist' },
                { value: 'shift_change', label: 'Shift Change Checklist' },
              ]}
              required
              register={register}
              error={errors.checklistType}
            />
          </div>

          {/* Progress Bar */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">
                {completedCount} of {totalCount} items ({completionPct}%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  completionPct === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Checklist Items</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    item.checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                      className="mt-1 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <label
                        className={`block font-medium ${
                          item.checked ? 'text-green-800 line-through' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </label>
                      {!item.checked && (
                        <input
                          type="text"
                          placeholder="Add notes (optional)"
                          value={item.notes || ''}
                          onChange={(e) => updateItemNotes(item.id, e.target.value)}
                          className="mt-2 w-full text-sm border-gray-300 rounded-md"
                        />
                      )}
                      {item.checked && item.notes && (
                        <p className="mt-1 text-sm text-green-700">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="border-t pt-6">
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
              {loading ? 'Submitting...' : 'Submit Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
