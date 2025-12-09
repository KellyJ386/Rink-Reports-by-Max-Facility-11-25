'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from '@/components/reports/ModuleForm'

const CO_THRESHOLD = 35 // ppm
const NO2_THRESHOLD = 0.5 // ppm

export default function NewAirQualityPage() {
  return (
    <ModuleForm
      moduleType="AIR_QUALITY"
      title="New Air Quality Reading"
      description="Record CO and NO2 levels for safety compliance"
      basePath="/dashboard/air-quality"
    >
      {({ customData, setCustomData, submitting }: { customData: Record<string, unknown>; setCustomData: (data: Record<string, unknown>) => void; submitting: boolean }) => {
        const coLevel = customData.coLevel as number | undefined
        const no2Level = customData.no2Level as number | undefined
        const coExceeded = coLevel !== undefined && coLevel > CO_THRESHOLD
        const no2Exceeded = no2Level !== undefined && no2Level > NO2_THRESHOLD

        return (
          <div className="space-y-6">
            {/* Warning Banner */}
            {(coExceeded || no2Exceeded) && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">⚠️ THRESHOLD EXCEEDED</h3>
                    <p className="text-red-700 mt-1">
                      {coExceeded && `CO level (${coLevel} ppm) exceeds safe threshold (${CO_THRESHOLD} ppm). `}
                      {no2Exceeded && `NO2 level (${no2Level} ppm) exceeds safe threshold (${NO2_THRESHOLD} ppm).`}
                    </p>
                    <p className="text-red-700 mt-2 font-semibold">
                      Consider evacuating the facility and increasing ventilation immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Air Quality Measurements</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CO Level (ppm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={coLevel || ''}
                    onChange={(e) => setCustomData({ ...customData, coLevel: parseFloat(e.target.value) || 0 })}
                    disabled={submitting}
                    className={`input w-full ${coExceeded ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Safe threshold: ≤{CO_THRESHOLD} ppm
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NO2 Level (ppm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={no2Level || ''}
                    onChange={(e) => setCustomData({ ...customData, no2Level: parseFloat(e.target.value) || 0 })}
                    disabled={submitting}
                    className={`input w-full ${no2Exceeded ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Safe threshold: ≤{NO2_THRESHOLD} ppm
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement Location
                  </label>
                  <select
                    value={(customData.location as string) || ''}
                    onChange={(e) => setCustomData({ ...customData, location: e.target.value })}
                    disabled={submitting}
                    className="input w-full"
                  >
                    <option value="">Select location...</option>
                    <option value="ICE_LEVEL">Ice Level</option>
                    <option value="BLEACHERS">Bleachers/Seating</option>
                    <option value="ZAMBONI_AREA">Zamboni Area</option>
                    <option value="LOCKER_ROOMS">Locker Rooms</option>
                    <option value="LOBBY">Lobby</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meter/Device Used
                  </label>
                  <input
                    type="text"
                    value={(customData.meterUsed as string) || ''}
                    onChange={(e) => setCustomData({ ...customData, meterUsed: e.target.value })}
                    disabled={submitting}
                    className="input w-full"
                    placeholder="e.g., BW GasAlert Clip"
                  />
                </div>
              </div>
            </div>

            {/* Compliance Status */}
            <div className={`rounded-lg p-6 ${
              coExceeded || no2Exceeded ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <div className="flex items-center gap-3">
                {coExceeded || no2Exceeded ? (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${coExceeded || no2Exceeded ? 'text-red-800' : 'text-green-800'}`}>
                    {coExceeded || no2Exceeded ? 'Non-Compliant' : 'Compliant'}
                  </h3>
                  <p className={`text-sm ${coExceeded || no2Exceeded ? 'text-red-700' : 'text-green-700'}`}>
                    {coExceeded || no2Exceeded
                      ? 'Air quality levels exceed safe thresholds'
                      : 'Air quality levels are within safe limits'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={(customData.notes as string) || ''}
                onChange={(e) => setCustomData({ ...customData, notes: e.target.value })}
                disabled={submitting}
                rows={4}
                className="input w-full"
                placeholder="Any observations about ventilation, activities occurring, etc..."
              />
            </div>
          </div>
        )
      }}
    </ModuleForm>
  )
}
