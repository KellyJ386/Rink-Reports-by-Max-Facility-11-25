import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, DataTable, StatusCell, DateCell } from '@/components/shared'
import type { Column } from '@/components/shared'
import { ThresholdBadge } from '@/components/air-quality/ThresholdAlert'

interface Submission {
  id: string
  submittedAt: Date
  status: string
  rink: { name: string }
  submittedBy: { firstName: string; lastName: string }
  data: any
}

// Default thresholds (should come from facility settings)
const CO_WARNING = 20
const CO_EVAC = 83
const NO2_WARNING = 0.3
const NO2_EVAC = 2.0

export default async function AirQualityPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'AIR_QUALITY',
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
      header: 'Rink',
      render: (row) => row.rink.name,
    },
    {
      key: 'coLevel',
      header: 'CO Level',
      render: (row) => {
        const co = row.data?.coLevel
        if (co === undefined || co === null) return '—'
        return (
          <div className="flex items-center gap-2">
            <span>{co} ppm</span>
            <ThresholdBadge value={co} warningThreshold={CO_WARNING} evacuationThreshold={CO_EVAC} />
          </div>
        )
      },
    },
    {
      key: 'no2Level',
      header: 'NO₂ Level',
      render: (row) => {
        const no2 = row.data?.no2Level
        if (no2 === undefined || no2 === null) return '—'
        return (
          <div className="flex items-center gap-2">
            <span>{no2} ppm</span>
            <ThresholdBadge value={no2} warningThreshold={NO2_WARNING} evacuationThreshold={NO2_EVAC} />
          </div>
        )
      },
    },
    {
      key: 'submittedBy',
      header: 'Submitted By',
      render: (row) => `${row.submittedBy.firstName} ${row.submittedBy.lastName}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusCell status={row.status} />,
    },
  ]

  // Check for any recent elevated readings
  const hasElevated = submissions.some((s) => {
    const data = s.data as any
    return (data?.coLevel >= CO_WARNING) || (data?.no2Level >= NO2_WARNING)
  })

  return (
    <div>
      <PageHeader
        title="Air Quality"
        description="Monitor CO and NO₂ levels for safety compliance"
        actions={
          <Link href="/dashboard/air-quality/new" className="btn btn-primary">
            + New Reading
          </Link>
        }
      />

      {/* Alert Banner */}
      {hasElevated && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-yellow-800">Elevated Readings Detected</p>
            <p className="text-sm text-yellow-700">
              Some recent readings show elevated CO or NO₂ levels. Review and take appropriate action.
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={submissions}
        keyField="id"
        rowHref={(row) => `/dashboard/air-quality/${row.id}`}
        emptyState={{
          icon: '🌡️',
          title: 'No air quality readings yet',
          description: 'Start monitoring air quality by recording a new reading.',
          actionLabel: 'Record First Reading',
          actionHref: '/dashboard/air-quality/new',
        }}
      />
    </div>
  )
}
