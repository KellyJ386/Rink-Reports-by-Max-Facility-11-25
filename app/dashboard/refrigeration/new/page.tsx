'use client'

import { useState } from 'react'
import { ModuleForm } from '@/components/reports/ModuleForm'

export default function NewRefrigerationPage() {
  return (
    <ModuleForm
      moduleType="REFRIGERATION"
      title="New Refrigeration Log"
      description="Record compressor and refrigeration system readings"
      basePath="/dashboard/refrigeration"
      requireRink={false}
    >
      {({ customData, setCustomData, submitting }: { customData: Record<string, unknown>; setCustomData: (data: Record<string, unknown>) => void; submitting: boolean }) => (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Compressor Readings</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compressor Status
                </label>
                <select
                  value={(customData.compressorStatus as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, compressorStatus: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                >
                  <option value="">Select...</option>
                  <option value="RUNNING">Running</option>
                  <option value="IDLE">Idle</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compressor Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={(customData.compressorTemp as number) || ''}
                  onChange={(e) => setCustomData({ ...customData, compressorTemp: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Pressure (psi)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={(customData.dischargePressure as number) || ''}
                  onChange={(e) => setCustomData({ ...customData, dischargePressure: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suction Pressure (psi)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={(customData.suctionPressure as number) || ''}
                  onChange={(e) => setCustomData({ ...customData, suctionPressure: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Oil Level
                </label>
                <select
                  value={(customData.oilLevel as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, oilLevel: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                >
                  <option value="">Select...</option>
                  <option value="FULL">Full</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Running Hours
                </label>
                <input
                  type="number"
                  value={(customData.runningHours as number) || ''}
                  onChange={(e) => setCustomData({ ...customData, runningHours: parseInt(e.target.value) || 0 })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Brine System</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brine Supply Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={(customData.brineSupplyTemp as number) || ''}
                  onChange={(e) => setCustomData({ ...customData, brineSupplyTemp: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brine Return Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={(customData.brineReturnTemp as number) || ''}
                  onChange={(e) => setCustomData({ ...customData, brineReturnTemp: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brine Level
                </label>
                <select
                  value={(customData.brineLevel as string) || ''}
                  onChange={(e) => setCustomData({ ...customData, brineLevel: e.target.value })}
                  disabled={submitting}
                  className="input w-full"
                >
                  <option value="">Select...</option>
                  <option value="FULL">Full</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                  <option value="CRITICAL">Critical</option>
                </select>
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
              placeholder="Any abnormalities or maintenance notes..."
            />
          </div>
        </div>
      )}
    </ModuleForm>
  )
}
