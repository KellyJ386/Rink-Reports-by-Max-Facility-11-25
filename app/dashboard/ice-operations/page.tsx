'use client'

import { ModuleList } from '@/components/reports/ModuleList'

export default function IceOperationsPage() {
  return (
    <ModuleList
      moduleType="ICE_OPERATIONS"
      title="Ice Operations"
      description="Track ice makes, circle checks, and edging operations"
      basePath="/dashboard/ice-operations"
      columns={[
        {
          key: 'operationType',
          label: 'Type',
          render: (submission) => {
            const type = submission.data?.operationType as string
            const types: Record<string, string> = {
              ICE_MAKE: 'Ice Make',
              CIRCLE_CHECK: 'Circle Check',
              EDGING: 'Edging',
              RESURFACE: 'Resurface',
            }
            return types[type] || type || '-'
          },
        },
        {
          key: 'duration',
          label: 'Duration',
          render: (submission) => {
            const duration = submission.data?.duration as number
            return duration ? `${duration} min` : '-'
          },
        },
      ]}
      emptyTitle="No ice operations recorded"
      emptyDescription="Start tracking your ice maintenance operations"
    />
  )
}
