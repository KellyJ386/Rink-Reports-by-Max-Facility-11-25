'use client'

import { useState } from 'react'
import { ModuleForm } from '@/components/reports/ModuleForm'

export default function NewIceOperationPage() {
  return (
    <ModuleForm
      moduleType="ICE_OPERATIONS"
      title="New Ice Operation"
      description="Record ice make, resurface, or maintenance operation"
      basePath="/dashboard/ice-operations"
    >
      {({ customData, setCustomData, submitting }: { customData: Record<string, unknown>; setCustomData: (data: Record<string, unknown>) => void; submitting: boolean }) => (
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Operation Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Type <span className="text-red-500">*</span>
              </label>
              <select
                value={(customData.operationType as string) || ''}
                onChange={(e) => setCustomData({ ...customData, operationType: e.target.value })}
                disabled={submitting}
                className="input w-full"
                required
              >
                <option value="">Select operation...</option>
                <option value="ICE_MAKE">Ice Make</option>
                <option value="RESURFACE">Resurface (Zamboni)</option>
                <option value="CIRCLE_CHECK">Circle Check</option>
                <option value="EDGING">Edging</option>
                <option value="FLOOD">Flood</option>
                <option value="SCRAPE">Scrape</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={(customData.duration as number) || ''}
                onChange={(e) => setCustomData({ ...customData, duration: parseInt(e.target.value) || 0 })}
                disabled={submitting}
                className="input w-full"
                placeholder="e.g., 15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Water Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={(customData.waterTemp as number) || ''}
                onChange={(e) => setCustomData({ ...customData, waterTemp: parseFloat(e.target.value) || 0 })}
                disabled={submitting}
                className="input w-full"
                placeholder="e.g., 140"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ice Surface Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={(customData.iceTemp as number) || ''}
                onChange={(e) => setCustomData({ ...customData, iceTemp: parseFloat(e.target.value) || 0 })}
                disabled={submitting}
                className="input w-full"
                placeholder="e.g., 22"
              />
            </div>
          </div>

          {/* Ice Make specific fields */}
          {customData.operationType === 'ICE_MAKE' && (
            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Ice Make Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layers Applied
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={(customData.layersApplied as number) || ''}
                    onChange={(e) => setCustomData({ ...customData, layersApplied: parseInt(e.target.value) || 0 })}
                    disabled={submitting}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Thickness (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={(customData.startingThickness as number) || ''}
                    onChange={(e) => setCustomData({ ...customData, startingThickness: parseFloat(e.target.value) || 0 })}
                    disabled={submitting}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ending Thickness (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={(customData.endingThickness as number) || ''}
                    onChange={(e) => setCustomData({ ...customData, endingThickness: parseFloat(e.target.value) || 0 })}
                    disabled={submitting}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Circle Check specific fields */}
          {customData.operationType === 'CIRCLE_CHECK' && (
            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Circle Check Items</h3>
              <div className="space-y-3">
                {['Blade condition', 'Conditioner tank', 'Towel condition', 'Hydraulics', 'Lights', 'Horn'].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={(customData.checkItems as string[] || []).includes(item)}
                      onChange={(e) => {
                        const current = (customData.checkItems as string[]) || []
                        setCustomData({
                          ...customData,
                          checkItems: e.target.checked
                            ? [...current, item]
                            : current.filter((i) => i !== item),
                        })
                      }}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={(customData.notes as string) || ''}
              onChange={(e) => setCustomData({ ...customData, notes: e.target.value })}
              disabled={submitting}
              rows={4}
              className="input w-full"
              placeholder="Any additional notes..."
            />
          </div>
        </div>
      )}
    </ModuleForm>
  )
}
