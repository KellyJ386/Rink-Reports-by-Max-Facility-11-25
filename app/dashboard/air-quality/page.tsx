'use client'

import { ModuleList } from '@/components/reports/ModuleList'

export default function AirQualityPage() {
  return (
    <ModuleList
      moduleType="AIR_QUALITY"
      title="Air Quality Readings"
      description="Monitor CO and NO2 levels for compliance and safety"
      basePath="/dashboard/air-quality"
      columns={[
        {
          key: 'coLevel',
          label: 'CO Level',
          render: (submission) => {
            const level = submission.data?.coLevel as number
            const threshold = 35 // ppm
            if (level === undefined) return '-'
            return (
              <span className={level > threshold ? 'text-red-600 font-semibold' : 'text-green-600'}>
                {level} ppm
              </span>
            )
          },
        },
        {
          key: 'no2Level',
          label: 'NO2 Level',
          render: (submission) => {
            const level = submission.data?.no2Level as number
            const threshold = 0.5 // ppm
            if (level === undefined) return '-'
            return (
              <span className={level > threshold ? 'text-red-600 font-semibold' : 'text-green-600'}>
                {level} ppm
              </span>
            )
          },
        },
        {
          key: 'compliance',
          label: 'Status',
          render: (submission) => {
            const co = submission.data?.coLevel as number
            const no2 = submission.data?.no2Level as number
            const isCompliant = (co === undefined || co <= 35) && (no2 === undefined || no2 <= 0.5)
            return (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isCompliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isCompliant ? 'Compliant' : 'Warning'}
              </span>
            )
          },
        },
      ]}
      emptyTitle="No air quality readings"
      emptyDescription="Start monitoring air quality for safety compliance"
    />
  )
}
