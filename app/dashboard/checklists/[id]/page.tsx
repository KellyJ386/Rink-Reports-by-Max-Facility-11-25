'use client'

import { use } from 'react'
import { ModuleView } from '@/components/reports/ModuleView'

export default function ChecklistViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ModuleView
      submissionId={id}
      title="Checklist"
      basePath="/dashboard/checklists"
      renderData={(data) => {
        const completed = data.completedItems as number || 0
        const total = data.totalItems as number || 0
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        const checkedItems = data.checkedItems as string[] || []

        return (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {String(data.checklistType || '').replace(/_/g, ' ')} Checklist
                </h2>
                <span className={`text-3xl font-bold ${percent === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                  {percent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    percent === 100 ? 'bg-green-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {completed} of {total} items completed
              </p>
            </div>

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Items</h2>
                <div className="space-y-2">
                  {checkedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        {item.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {data.notes && (
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
