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

export default async function IceDepthPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'ICE_DEPTH',
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
      key: 'avgDepth',
      header: 'Avg Depth',
      render: (row) => {
        const measurements = row.data?.measurements || []
        const values = measurements.filter((m: any) => m.value != null).map((m: any) => m.value)
        if (values.length === 0) return '—'
        const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
        return `${avg.toFixed(2)}"`
      },
    },
    {
      key: 'points',
      header: 'Points Measured',
      render: (row) => {
        const measurements = row.data?.measurements || []
        const filled = measurements.filter((m: any) => m.value != null).length
        const total = measurements.length
        return `${filled}/${total}`
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

  return (
    <div>
      <PageHeader
        title="Ice Depth"
        description="Track ice thickness measurements across the rink surface"
        actions={
          <Link href="/dashboard/ice-depth/new" className="btn btn-primary">
            + New Measurement
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={submissions}
        keyField="id"
        rowHref={(row) => `/dashboard/ice-depth/${row.id}`}
        emptyState={{
          icon: '📏',
          title: 'No ice depth measurements yet',
          description: 'Start tracking your ice thickness by recording a new measurement.',
          actionLabel: 'Record First Measurement',
          actionHref: '/dashboard/ice-depth/new',
        }}
      />
    </div>
  )
}
