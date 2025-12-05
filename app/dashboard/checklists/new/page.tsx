'use client'

import { useState } from 'react'
import { ModuleForm } from '@/components/reports/ModuleForm'

const OPENING_ITEMS = [
  { id: 'lights_on', label: 'Turn on all lights', category: 'Facility' },
  { id: 'hvac_check', label: 'Check HVAC system', category: 'Facility' },
  { id: 'ice_inspect', label: 'Inspect ice surface', category: 'Ice' },
  { id: 'boards_check', label: 'Check boards and glass', category: 'Ice' },
  { id: 'goals_position', label: 'Position goals correctly', category: 'Ice' },
  { id: 'locker_rooms_unlock', label: 'Unlock locker rooms', category: 'Facility' },
  { id: 'bathrooms_clean', label: 'Verify bathrooms are clean', category: 'Facility' },
  { id: 'zamboni_ready', label: 'Zamboni pre-flight check', category: 'Equipment' },
  { id: 'first_aid_check', label: 'Check first aid supplies', category: 'Safety' },
  { id: 'aed_check', label: 'Verify AED is operational', category: 'Safety' },
]

const CLOSING_ITEMS = [
  { id: 'ice_resurface', label: 'Final ice resurface', category: 'Ice' },
  { id: 'locker_rooms_clear', label: 'Clear and lock locker rooms', category: 'Facility' },
  { id: 'lost_found_check', label: 'Check for lost items', category: 'Facility' },
  { id: 'trash_empty', label: 'Empty trash receptacles', category: 'Facility' },
  { id: 'lights_off', label: 'Turn off non-essential lights', category: 'Facility' },
  { id: 'doors_secure', label: 'Secure all doors', category: 'Security' },
  { id: 'alarm_set', label: 'Set alarm system', category: 'Security' },
  { id: 'zamboni_charge', label: 'Zamboni plugged in to charge', category: 'Equipment' },
  { id: 'refrigeration_check', label: 'Verify refrigeration settings', category: 'Equipment' },
  { id: 'hvac_adjust', label: 'Adjust HVAC for overnight', category: 'Facility' },
]

export default function NewChecklistPage() {
  return (
    <ModuleForm
      moduleType="CHECKLIST"
      title="New Checklist"
      description="Complete opening, closing, or custom facility checklist"
      basePath="/dashboard/checklists"
      onSubmit={({ formData }) => {
        const customData = formData
        const checkedItems = Object.entries(customData)
          .filter(([key, value]) => key.startsWith('item_') && value === true)
          .map(([key]) => key.replace('item_', ''))

        const items = customData.checklistType === 'OPENING' ? OPENING_ITEMS :
                      customData.checklistType === 'CLOSING' ? CLOSING_ITEMS : []

        return {
          ...customData,
          completedItems: checkedItems.length,
          totalItems: items.length,
          checkedItems,
        }
      }}
    >
      {({ customData, setCustomData, submitting }: { customData: Record<string, unknown>; setCustomData: (data: Record<string, unknown>) => void; submitting: boolean }) => {
        const checklistType = customData.checklistType as string
        const items = checklistType === 'OPENING' ? OPENING_ITEMS :
                      checklistType === 'CLOSING' ? CLOSING_ITEMS : []

        const checkedCount = items.filter(item => customData[`item_${item.id}`]).length
        const completionPercent = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0

        const categories = [...new Set(items.map(item => item.category))]

        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Checklist Type</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'OPENING', label: 'Opening Checklist', icon: '🌅' },
                  { value: 'CLOSING', label: 'Closing Checklist', icon: '🌙' },
                  { value: 'CUSTOM', label: 'Custom Checklist', icon: '📋' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCustomData({ ...customData, checklistType: type.value })}
                    disabled={submitting}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      checklistType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {items.length > 0 && (
              <>
                {/* Progress */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
                    <span className="text-2xl font-bold text-blue-600">{completionPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        completionPercent === 100 ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {checkedCount} of {items.length} items completed
                  </p>
                </div>

                {/* Checklist Items by Category */}
                {categories.map((category) => (
                  <div key={category} className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">{category}</h3>
                    <div className="space-y-3">
                      {items
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              customData[`item_${item.id}`]
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={(customData[`item_${item.id}`] as boolean) || false}
                              onChange={(e) => setCustomData({
                                ...customData,
                                [`item_${item.id}`]: e.target.checked,
                              })}
                              disabled={submitting}
                              className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className={`text-sm ${
                              customData[`item_${item.id}`]
                                ? 'text-green-800 line-through'
                                : 'text-gray-700'
                            }`}>
                              {item.label}
                            </span>
                            {Boolean(customData[`item_${item.id}`]) && (
                              <svg className="w-5 h-5 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={(customData.notes as string) || ''}
                onChange={(e) => setCustomData({ ...customData, notes: e.target.value })}
                disabled={submitting}
                rows={4}
                className="input w-full"
                placeholder="Any issues or items that need attention..."
              />
            </div>
          </div>
        )
      }}
    </ModuleForm>
  )
}
