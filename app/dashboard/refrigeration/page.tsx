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

export default async function RefrigerationPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'REFRIGERATION',
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
      key: 'compressorStatus',
      header: 'Compressor',
      render: (row) => {
        const status = row.data?.compressorStatus || 'normal'
        return (
          <span className={status === 'normal' ? 'text-green-600' : 'text-red-600'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
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

  return (
    <div>
      <PageHeader
        title="Refrigeration"
        description="Monitor refrigeration system readings and equipment status"
        actions={
          <Link href="/dashboard/refrigeration/new" className="btn btn-primary">
            + New Reading
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={submissions}
        keyField="id"
        rowHref={(row) => `/dashboard/refrigeration/${row.id}`}
        emptyState={{
          icon: '❄️',
          title: 'No refrigeration readings yet',
          description: 'Start monitoring your refrigeration system by recording a new reading.',
          actionLabel: 'Record First Reading',
          actionHref: '/dashboard/refrigeration/new',
        }}
      />
    </div>
  )
}
