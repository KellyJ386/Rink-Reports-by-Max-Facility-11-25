'use client'

import { useForm } from 'react-hook-form'

interface AirQualityData {
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
}

interface AirQualityThresholdsProps {
  initialData: AirQualityData
  onSave: (data: AirQualityData) => Promise<void>
  isLoading?: boolean
}

export default function AirQualityThresholds({
  initialData,
  onSave,
  isLoading = false,
}: AirQualityThresholdsProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<AirQualityData>({
    defaultValues: initialData,
  })

  const alertsEnabled = watch('enableAirQualityAlerts')

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Air Quality Alert Thresholds</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure when air quality alerts are triggered based on CO and NO2 levels.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <label htmlFor="enableAirQualityAlerts" className="text-sm font-medium text-gray-900">
                Enable Air Quality Alerts
              </label>
              <p className="text-sm text-gray-500">
                Send notifications when thresholds are exceeded
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="enableAirQualityAlerts"
                {...register('enableAirQualityAlerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {alertsEnabled && (
            <>
              {/* Carbon Monoxide (CO) */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Carbon Monoxide (CO) Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <label
                      htmlFor="coWarningPpm"
                      className="block text-sm font-medium text-yellow-800"
                    >
                      Warning Level
                    </label>
                    <p className="text-xs text-yellow-600 mb-2">
                      Triggers a warning notification
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        id="coWarningPpm"
                        step="0.1"
                        {...register('coWarningPpm', {
                          valueAsNumber: true,
                          min: 0,
                          max: 1000,
                        })}
                        className="block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-yellow-600">
                        ppm
                      </span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      OSHA PEL: 50 ppm (8-hour TWA)
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <label
                      htmlFor="coEvacuationPpm"
                      className="block text-sm font-medium text-red-800"
                    >
                      Evacuation Level
                    </label>
                    <p className="text-xs text-red-600 mb-2">
                      Triggers evacuation alert
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        id="coEvacuationPpm"
                        step="0.1"
                        {...register('coEvacuationPpm', {
                          valueAsNumber: true,
                          min: 0,
                          max: 1000,
                        })}
                        className="block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-600">
                        ppm
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      NIOSH IDLH: 1200 ppm
                    </p>
                  </div>
                </div>
              </div>

              {/* Nitrogen Dioxide (NO2) */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Nitrogen Dioxide (NO2) Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <label
                      htmlFor="no2WarningPpm"
                      className="block text-sm font-medium text-yellow-800"
                    >
                      Warning Level
                    </label>
                    <p className="text-xs text-yellow-600 mb-2">
                      Triggers a warning notification
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        id="no2WarningPpm"
                        step="0.01"
                        {...register('no2WarningPpm', {
                          valueAsNumber: true,
                          min: 0,
                          max: 100,
                        })}
                        className="block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-yellow-600">
                        ppm
                      </span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      OSHA PEL: 5 ppm (Ceiling)
                    </p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <label
                      htmlFor="no2EvacuationPpm"
                      className="block text-sm font-medium text-red-800"
                    >
                      Evacuation Level
                    </label>
                    <p className="text-xs text-red-600 mb-2">
                      Triggers evacuation alert
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        id="no2EvacuationPpm"
                        step="0.01"
                        {...register('no2EvacuationPpm', {
                          valueAsNumber: true,
                          min: 0,
                          max: 100,
                        })}
                        className="block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-red-600">
                        ppm
                      </span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      NIOSH IDLH: 20 ppm
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Air Quality Settings'}
        </button>
      </div>
    </form>
  )
}
