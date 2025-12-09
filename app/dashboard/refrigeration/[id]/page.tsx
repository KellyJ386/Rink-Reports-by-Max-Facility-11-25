'use client'

import { use } from 'react'
import { ModuleView } from '@/components/reports/ModuleView'

const TEMP_LIMITS = {
  brineSupply: { min: 10, max: 22 },
  brineReturn: { min: 12, max: 24 },
  suction: { min: -10, max: 5 },
  discharge: { min: 120, max: 180 },
}

export default function RefrigerationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const isOutOfRange = (value: number, limits: { min: number; max: number }) => {
    return value < limits.min || value > limits.max
  }

  return (
    <ModuleView
      submissionId={id}
      title="Refrigeration Log"
      basePath="/dashboard/refrigeration"
      renderData={(data) => {
        const brineSupply = data.brineSupplyTemp as number
        const brineReturn = data.brineReturnTemp as number
        const suction = data.suctionTemp as number
        const discharge = data.dischargeTemp as number
        const suctionPressure = data.suctionPressure as number
        const dischargePressure = data.dischargePressure as number

        const hasWarnings =
          (brineSupply && isOutOfRange(brineSupply, TEMP_LIMITS.brineSupply)) ||
          (brineReturn && isOutOfRange(brineReturn, TEMP_LIMITS.brineReturn)) ||
          (suction && isOutOfRange(suction, TEMP_LIMITS.suction)) ||
          (discharge && isOutOfRange(discharge, TEMP_LIMITS.discharge))

        return (
          <div className="space-y-6">
            {/* Warning Banner */}
            {Boolean(hasWarnings) && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-red-800">READINGS OUT OF RANGE</h3>
                    <p className="text-red-700 mt-1">One or more temperature readings are outside normal operating parameters.</p>
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            {Boolean(data.systemStatus) && (
              <div className={`rounded-lg p-4 border ${
                data.systemStatus === 'RUNNING' ? 'bg-green-50 border-green-300' :
                data.systemStatus === 'STANDBY' ? 'bg-yellow-50 border-yellow-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    data.systemStatus === 'RUNNING' ? 'bg-green-500 animate-pulse' :
                    data.systemStatus === 'STANDBY' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-semibold">System Status: {String(data.systemStatus)}</span>
                </div>
              </div>
            )}

            {/* Temperature Readings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Temperature Readings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brineSupply !== undefined && (
                  <div className={`p-4 rounded-lg ${
                    isOutOfRange(brineSupply, TEMP_LIMITS.brineSupply)
                      ? 'bg-red-50 border-2 border-red-300'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="text-sm text-gray-600">Brine Supply</div>
                    <div className={`text-3xl font-bold ${
                      isOutOfRange(brineSupply, TEMP_LIMITS.brineSupply) ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {brineSupply}°F
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Range: {TEMP_LIMITS.brineSupply.min}°F - {TEMP_LIMITS.brineSupply.max}°F
                    </div>
                  </div>
                )}

                {brineReturn !== undefined && (
                  <div className={`p-4 rounded-lg ${
                    isOutOfRange(brineReturn, TEMP_LIMITS.brineReturn)
                      ? 'bg-red-50 border-2 border-red-300'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="text-sm text-gray-600">Brine Return</div>
                    <div className={`text-3xl font-bold ${
                      isOutOfRange(brineReturn, TEMP_LIMITS.brineReturn) ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {brineReturn}°F
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Range: {TEMP_LIMITS.brineReturn.min}°F - {TEMP_LIMITS.brineReturn.max}°F
                    </div>
                  </div>
                )}

                {suction !== undefined && (
                  <div className={`p-4 rounded-lg ${
                    isOutOfRange(suction, TEMP_LIMITS.suction)
                      ? 'bg-red-50 border-2 border-red-300'
                      : 'bg-cyan-50 border border-cyan-200'
                  }`}>
                    <div className="text-sm text-gray-600">Suction Temperature</div>
                    <div className={`text-3xl font-bold ${
                      isOutOfRange(suction, TEMP_LIMITS.suction) ? 'text-red-600' : 'text-cyan-600'
                    }`}>
                      {suction}°F
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Range: {TEMP_LIMITS.suction.min}°F - {TEMP_LIMITS.suction.max}°F
                    </div>
                  </div>
                )}

                {discharge !== undefined && (
                  <div className={`p-4 rounded-lg ${
                    isOutOfRange(discharge, TEMP_LIMITS.discharge)
                      ? 'bg-red-50 border-2 border-red-300'
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="text-sm text-gray-600">Discharge Temperature</div>
                    <div className={`text-3xl font-bold ${
                      isOutOfRange(discharge, TEMP_LIMITS.discharge) ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {discharge}°F
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Range: {TEMP_LIMITS.discharge.min}°F - {TEMP_LIMITS.discharge.max}°F
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pressure Readings */}
            {Boolean(suctionPressure || dischargePressure) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Pressure Readings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suctionPressure !== undefined && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Suction Pressure</div>
                      <div className="text-3xl font-bold text-gray-800">{suctionPressure} PSI</div>
                    </div>
                  )}
                  {dischargePressure !== undefined && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Discharge Pressure</div>
                      <div className="text-3xl font-bold text-gray-800">{dischargePressure} PSI</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compressor Info */}
            {Boolean(data.compressorNumber || data.oilLevel || data.runHours) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Compressor Information</h2>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Boolean(data.compressorNumber) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Compressor #</dt>
                      <dd className="text-lg font-semibold text-gray-900 mt-1">{String(data.compressorNumber)}</dd>
                    </div>
                  )}
                  {Boolean(data.oilLevel) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Oil Level</dt>
                      <dd className="text-lg font-semibold text-gray-900 mt-1 capitalize">{String(data.oilLevel)}</dd>
                    </div>
                  )}
                  {Boolean(data.runHours) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Run Hours</dt>
                      <dd className="text-lg font-semibold text-gray-900 mt-1">{String(data.runHours)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Notes */}
            {Boolean(data.notes) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{String(data.notes)}</p>
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
