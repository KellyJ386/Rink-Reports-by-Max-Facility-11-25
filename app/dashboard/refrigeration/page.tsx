'use client'

import { ModuleList } from '@/components/reports/ModuleList'

export default function RefrigerationPage() {
  return (
    <ModuleList
      moduleType="REFRIGERATION"
      title="Refrigeration Logs"
      description="Monitor compressor operations and refrigeration system readings"
      basePath="/dashboard/refrigeration"
      columns={[
        {
          key: 'compressorTemp',
          label: 'Compressor Temp',
          render: (submission) => {
            const temp = submission.data?.compressorTemp as number
            return temp !== undefined ? `${temp}°F` : '-'
          },
        },
        {
          key: 'brineTemp',
          label: 'Brine Temp',
          render: (submission) => {
            const temp = submission.data?.brineTemp as number
            return temp !== undefined ? `${temp}°F` : '-'
          },
        },
      ]}
      emptyTitle="No refrigeration logs"
      emptyDescription="Start monitoring your refrigeration system"
    />
  )
}
