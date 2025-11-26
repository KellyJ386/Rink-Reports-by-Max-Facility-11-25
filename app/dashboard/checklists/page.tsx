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

export default async function ChecklistsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'DAILY_CHECKLIST',
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
      key: 'checklistType',
      header: 'Type',
      render: (row) => {
        const type = row.data?.checklistType || 'opening'
        const labels: Record<string, string> = {
          opening: 'Opening',
          closing: 'Closing',
          shift_change: 'Shift Change',
        }
        return labels[type] || type
      },
    },
    {
      key: 'completion',
      header: 'Completion',
      render: (row) => {
        const items = row.data?.items || []
        const completed = items.filter((i: any) => i.checked).length
        const total = items.length
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{pct}%</span>
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

  return (
    <div>
      <PageHeader
        title="Daily Checklists"
        description="Opening, closing, and shift change checklists"
        actions={
          <Link href="/dashboard/checklists/new" className="btn btn-primary">
            + New Checklist
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={submissions}
        keyField="id"
        rowHref={(row) => `/dashboard/checklists/${row.id}`}
        emptyState={{
          icon: '✓',
          title: 'No checklists completed yet',
          description: 'Start your daily operations by completing a checklist.',
          actionLabel: 'Start Checklist',
          actionHref: '/dashboard/checklists/new',
        }}
      />
    </div>
  )
}
