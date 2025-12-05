'use client'

import { use } from 'react'
import { ModuleView } from '@/components/reports/ModuleView'

export default function IceOperationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ModuleView
      submissionId={id}
      title="Ice Operation Report"
      basePath="/dashboard/ice-operations"
      renderData={(data) => {
        const operationType = String(data.operationType || '').replace(/_/g, ' ')
        const duration = data.duration as number

        return (
          <div className="space-y-6">
            {/* Operation Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operation Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Operation Type</div>
                  <div className="text-xl font-bold text-blue-900 mt-1 capitalize">{operationType || '-'}</div>
                </div>
                {Boolean(duration) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium">Duration</div>
                    <div className="text-xl font-bold text-green-900 mt-1">{duration} min</div>
                  </div>
                )}
                {Boolean(data.iceSheet) && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium">Ice Sheet</div>
                    <div className="text-xl font-bold text-purple-900 mt-1">{String(data.iceSheet)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment & Settings */}
            {Boolean(data.equipment || data.waterTemperature || data.bladeCondition) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment & Settings</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Boolean(data.equipment) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Equipment Used</dt>
                      <dd className="text-sm text-gray-900 mt-1">{String(data.equipment)}</dd>
                    </div>
                  )}
                  {Boolean(data.waterTemperature) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Water Temperature</dt>
                      <dd className="text-sm text-gray-900 mt-1">{String(data.waterTemperature)}°F</dd>
                    </div>
                  )}
                  {Boolean(data.bladeCondition) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Blade Condition</dt>
                      <dd className="text-sm text-gray-900 mt-1 capitalize">{String(data.bladeCondition).replace(/_/g, ' ')}</dd>
                    </div>
                  )}
                  {Boolean(data.waterUsage) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Water Usage</dt>
                      <dd className="text-sm text-gray-900 mt-1">{String(data.waterUsage)} gallons</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Ice Conditions */}
            {Boolean(data.iceConditionBefore || data.iceConditionAfter) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ice Conditions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Boolean(data.iceConditionBefore) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Before Operation</h3>
                      <div className="bg-gray-50 rounded p-3">
                        <span className="capitalize">{String(data.iceConditionBefore).replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  )}
                  {Boolean(data.iceConditionAfter) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">After Operation</h3>
                      <div className="bg-green-50 rounded p-3">
                        <span className="capitalize">{String(data.iceConditionAfter).replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {Boolean(data.notes) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{String(data.notes)}</p>
              </div>
            )}

            {/* Issues Reported */}
            {Boolean(data.issues) && (
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h2 className="text-lg font-semibold text-yellow-800">Issues Reported</h2>
                    <p className="text-yellow-700 mt-1 whitespace-pre-wrap">{String(data.issues)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
