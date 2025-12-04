'use client'

import { ModuleList } from '@/components/reports/ModuleList'

export default function IncidentsPage() {
  return (
    <ModuleList
      moduleType="INCIDENT"
      title="Incident Reports"
      description="Document and track facility incidents and injuries"
      basePath="/dashboard/incidents"
      columns={[
        {
          key: 'incidentType',
          label: 'Type',
          render: (submission) => {
            const type = submission.data?.incidentType as string
            const types: Record<string, string> = {
              INJURY: 'Injury',
              PROPERTY_DAMAGE: 'Property Damage',
              NEAR_MISS: 'Near Miss',
              SAFETY_CONCERN: 'Safety Concern',
              OTHER: 'Other',
            }
            return types[type] || type || '-'
          },
        },
        {
          key: 'severity',
          label: 'Severity',
          render: (submission) => {
            const severity = submission.data?.severity as string
            const colors: Record<string, string> = {
              MINOR: 'bg-yellow-100 text-yellow-700',
              MODERATE: 'bg-orange-100 text-orange-700',
              SEVERE: 'bg-red-100 text-red-700',
            }
            return severity ? (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[severity] || ''}`}>
                {severity}
              </span>
            ) : '-'
          },
        },
        {
          key: 'injuredParty',
          label: 'Injured Party',
          render: (submission) => {
            const name = submission.data?.injuredPartyName as string
            return name || '-'
          },
        },
      ]}
      emptyIcon={
        <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      emptyTitle="No incidents reported"
      emptyDescription="Fortunately, there are no incident reports to display"
    />
  )
}
