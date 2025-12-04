'use client'

import { use } from 'react'
import { ModuleView } from '@/components/reports/ModuleView'

const CO_THRESHOLD = 35
const NO2_THRESHOLD = 0.5

export default function AirQualityViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ModuleView
      submissionId={id}
      title="Air Quality Reading"
      basePath="/dashboard/air-quality"
      renderData={(data) => {
        const coLevel = data.coLevel as number
        const no2Level = data.no2Level as number
        const coExceeded = coLevel > CO_THRESHOLD
        const no2Exceeded = no2Level > NO2_THRESHOLD

        return (
          <div className="space-y-6">
            {/* Warning */}
            {(coExceeded || no2Exceeded) && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-red-800">THRESHOLD EXCEEDED</h3>
                    <p className="text-red-700 mt-1">
                      {coExceeded && `CO: ${coLevel} ppm (limit: ${CO_THRESHOLD} ppm). `}
                      {no2Exceeded && `NO2: ${no2Level} ppm (limit: ${NO2_THRESHOLD} ppm).`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Readings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Readings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-lg ${coExceeded ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border border-green-200'}`}>
                  <div className="text-sm text-gray-600 mb-1">CO Level</div>
                  <div className={`text-4xl font-bold ${coExceeded ? 'text-red-600' : 'text-green-600'}`}>
                    {coLevel} <span className="text-lg font-normal">ppm</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Threshold: {CO_THRESHOLD} ppm</div>
                </div>

                <div className={`p-6 rounded-lg ${no2Exceeded ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border border-green-200'}`}>
                  <div className="text-sm text-gray-600 mb-1">NO2 Level</div>
                  <div className={`text-4xl font-bold ${no2Exceeded ? 'text-red-600' : 'text-green-600'}`}>
                    {no2Level} <span className="text-lg font-normal">ppm</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Threshold: {NO2_THRESHOLD} ppm</div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(data.location || data.meterUsed || data.notes) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                <dl className="space-y-3">
                  {data.location && (
                    <div className="flex gap-4">
                      <dt className="text-sm font-medium text-gray-500 w-1/3">Location</dt>
                      <dd className="text-sm text-gray-900">{String(data.location).replace(/_/g, ' ')}</dd>
                    </div>
                  )}
                  {data.meterUsed && (
                    <div className="flex gap-4">
                      <dt className="text-sm font-medium text-gray-500 w-1/3">Meter Used</dt>
                      <dd className="text-sm text-gray-900">{String(data.meterUsed)}</dd>
                    </div>
                  )}
                  {data.notes && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-sm font-medium text-gray-500">Notes</dt>
                      <dd className="text-sm text-gray-900">{String(data.notes)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
