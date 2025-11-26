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

export default async function IceOperationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // Fetch submissions
  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'ICE_OPERATIONS',
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
      key: 'type',
      header: 'Operation Type',
      render: (row) => row.data?.operationType || 'Ice Make',
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
        title="Ice Operations"
        description="Track ice makes, circle checks, edging, and blade changes"
        actions={
          <Link href="/dashboard/ice-operations/new" className="btn btn-primary">
            + New Report
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={submissions}
        keyField="id"
        rowHref={(row) => `/dashboard/ice-operations/${row.id}`}
        emptyState={{
          icon: '🏒',
          title: 'No ice operations reports yet',
          description: 'Start tracking your ice operations by creating a new report.',
          actionLabel: 'Create First Report',
          actionHref: '/dashboard/ice-operations/new',
        }}
      />
    </div>
  )
}
