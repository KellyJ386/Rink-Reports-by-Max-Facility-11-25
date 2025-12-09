'use client'

import { useForm } from 'react-hook-form'

interface RetentionData {
  iceDepthRetention: number
  iceOpsRetention: number
  refrigerationRetention: number
  airQualityRetention: number
  incidentRetention: number
  scheduleRetention: number
  checklistRetention: number
}

interface RetentionSettingsProps {
  initialData: RetentionData
  onSave: (data: RetentionData) => Promise<void>
  isLoading?: boolean
}

const RETENTION_FIELDS = [
  { key: 'iceDepthRetention', label: 'Ice Depth Reports', description: 'Ice depth measurement records' },
  { key: 'iceOpsRetention', label: 'Ice Operations Reports', description: 'Resurfacing and maintenance logs' },
  { key: 'refrigerationRetention', label: 'Refrigeration Reports', description: 'Equipment readings and logs' },
  { key: 'airQualityRetention', label: 'Air Quality Reports', description: 'CO and NO2 monitoring data' },
  { key: 'incidentRetention', label: 'Incident Reports', description: 'Accident and incident records' },
  { key: 'scheduleRetention', label: 'Schedule Data', description: 'Staff schedules and shifts' },
  { key: 'checklistRetention', label: 'Daily Checklists', description: 'Opening/closing checklists' },
]

export default function RetentionSettings({
  initialData,
  onSave,
  isLoading = false,
}: RetentionSettingsProps) {
  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<RetentionData>({
    defaultValues: initialData,
  })

  const daysToYears = (days: number) => {
    if (days === 0) return 'Forever'
    if (days >= 365) {
      const years = Math.floor(days / 365)
      return `${years} year${years > 1 ? 's' : ''}`
    }
    return `${days} days`
  }

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Data Retention Policies</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure how long data is retained before being automatically archived.
            Enter 0 for indefinite retention.
          </p>
        </div>

        <div className="divide-y">
          {RETENTION_FIELDS.map((field) => (
            <div key={field.key} className="px-6 py-4 flex items-center justify-between">
              <div>
                <label
                  htmlFor={field.key}
                  className="block text-sm font-medium text-gray-900"
                >
                  {field.label}
                </label>
                <p className="text-sm text-gray-500">{field.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="number"
                    id={field.key}
                    {...register(field.key as keyof RetentionData, {
                      valueAsNumber: true,
                      min: 0,
                      max: 3650,
                    })}
                    min={0}
                    max={3650}
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    days
                  </span>
                </div>
                <span className="text-sm text-gray-500 w-20">
                  ({daysToYears(initialData[field.key as keyof RetentionData])})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Retention Settings'}
        </button>
      </div>
    </form>
  )
}
