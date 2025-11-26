import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, DataTable, StatusCell, DateCell } from '@/components/shared'
import type { Column } from '@/components/shared'

interface Submission {
  id: string
  submittedAt: Date
  status: string
  rink: { name: string }
  submittedBy: { firstName: string; lastName: string }
  data: any
}

export default async function IncidentsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'INCIDENT',
      },
      archivedAt: null,
    },
    orderBy: { submittedAt: 'desc' },
    take: 50,
    include: {
      rink: { select: { name: true } },
      submittedBy: { select: { firstName: true, lastName: true } },
    },
  })

  const columns: Column<Submission>[] = [
    {
      key: 'submittedAt',
      header: 'Date & Time',
      sortable: true,
      render: (row) => <DateCell date={row.submittedAt} includeTime />,
    },
    {
      key: 'rink',
      header: 'Location',
      render: (row) => row.rink.name,
    },
    {
      key: 'incidentType',
      header: 'Type',
      render: (row) => {
        const type = row.data?.incidentType || 'other'
        const labels: Record<string, string> = {
          injury: 'Injury',
          near_miss: 'Near Miss',
          property_damage: 'Property Damage',
          medical_emergency: 'Medical Emergency',
          other: 'Other',
        }
        return labels[type] || type
      },
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => {
        const severity = row.data?.severity || 'minor'
        const config: Record<string, { label: string; color: string }> = {
          minor: { label: 'Minor', color: 'bg-yellow-100 text-yellow-800' },
          moderate: { label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
          severe: { label: 'Severe', color: 'bg-red-100 text-red-800' },
        }
        const { label, color } = config[severity] || config.minor
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
      },
    },
    {
      key: 'ambulance',
      header: 'Ambulance',
      render: (row) => (
        row.data?.ambulanceCalled ? (
          <span className="text-red-600 font-medium">🚑 Yes</span>
        ) : (
          <span className="text-gray-400">No</span>
        )
      ),
    },
    {
      key: 'submittedBy',
      header: 'Reported By',
      render: (row) => `${row.submittedBy.firstName} ${row.submittedBy.lastName}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusCell status={row.status} />,
    },
  ]

  // Check for critical incidents
  const hasCritical = submissions.some((s) => {
    const data = s.data as any
    return data?.ambulanceCalled || data?.severity === 'severe'
  })

  return (
    <div>
      <PageHeader
        title="Incidents"
        description="Report and track accidents, injuries, and near misses"
        actions={
          <Link href="/dashboard/incidents/new" className="btn btn-primary">
            + Report Incident
          </Link>
        }
      />

      {hasCritical && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-medium text-red-800">Critical Incidents Require Review</p>
            <p className="text-sm text-red-700">
              Some incidents involve ambulance calls or severe injuries. Please ensure proper follow-up.
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={submissions}
        keyField="id"
        rowHref={(row) => `/dashboard/incidents/${row.id}`}
        emptyState={{
          icon: '⚠️',
          title: 'No incidents reported',
          description: 'No incidents have been reported. Report any accidents or near misses here.',
          actionLabel: 'Report Incident',
          actionHref: '/dashboard/incidents/new',
        }}
      />
    </div>
  )
}
