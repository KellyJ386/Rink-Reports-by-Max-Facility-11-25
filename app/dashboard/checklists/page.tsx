'use client'

import { ModuleList } from '@/components/reports/ModuleList'

export default function ChecklistsPage() {
  return (
    <ModuleList
      moduleType="CHECKLIST"
      title="Daily Checklists"
      description="Track opening, closing, and routine facility checklists"
      basePath="/dashboard/checklists"
      columns={[
        {
          key: 'checklistType',
          label: 'Type',
          render: (submission) => {
            const type = submission.data?.checklistType as string
            const types: Record<string, string> = {
              OPENING: 'Opening',
              CLOSING: 'Closing',
              SAFETY: 'Safety',
              MAINTENANCE: 'Maintenance',
              CUSTOM: 'Custom',
            }
            return types[type] || type || '-'
          },
        },
        {
          key: 'completion',
          label: 'Completion',
          render: (submission) => {
            const completed = submission.data?.completedItems as number
            const total = submission.data?.totalItems as number
            if (completed === undefined || total === undefined) return '-'
            const percent = Math.round((completed / total) * 100)
            return (
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      percent === 100 ? 'bg-green-500' : percent >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{percent}%</span>
              </div>
            )
          },
        },
      ]}
      emptyIcon={
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      }
      emptyTitle="No checklists completed"
      emptyDescription="Start tracking daily facility operations"
    />
  )
}
