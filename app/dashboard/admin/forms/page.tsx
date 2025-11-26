import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, DataTable, StatusBadge, DateCell } from '@/components/shared'
import type { Column } from '@/components/shared'

interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: string
  version: number
  isActive: boolean
  isLocked: boolean
  createdAt: Date
  updatedAt: Date
  _count: { submissions: number }
}

const moduleLabels: Record<string, string> = {
  ICE_DEPTH: 'Ice Depth',
  ICE_OPERATIONS: 'Ice Operations',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incidents',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

export default async function FormsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const templates = await prisma.formTemplate.findMany({
    where: { facilityId: session.user.facilityId },
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: [{ moduleType: 'asc' }, { updatedAt: 'desc' }],
  })

  const columns: Column<FormTemplate>[] = [
    {
      key: 'name',
      header: 'Template Name',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.description && (
            <p className="text-sm text-gray-500 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'moduleType',
      header: 'Module',
      render: (row) => moduleLabels[row.moduleType] || row.moduleType,
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => `v${row.version}`,
    },
    {
      key: 'submissions',
      header: 'Submissions',
      render: (row) => row._count.submissions,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex gap-1">
          <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
          {row.isLocked && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              🔒 Locked
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (row) => <DateCell date={row.updatedAt} />,
    },
  ]

  // Group by module for quick access
  const moduleGroups = Object.keys(moduleLabels).map((type) => ({
    type,
    label: moduleLabels[type],
    count: templates.filter((t) => t.moduleType === type && t.isActive).length,
  }))

  return (
    <div>
      <PageHeader
        title="Form Templates"
        description="Manage form templates for each module"
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
        actions={
          <Link href="/dashboard/admin/forms/new" className="btn btn-primary">
            + Create Template
          </Link>
        }
      />

      {/* Module Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {moduleGroups.map((group) => (
          <div
            key={group.type}
            className={`p-3 rounded-lg border text-center ${
              group.count > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <p className="text-xs text-gray-500">{group.label}</p>
            <p className={`text-lg font-bold ${group.count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {group.count}
            </p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={templates}
        keyField="id"
        rowHref={(row) => `/dashboard/admin/forms/${row.id}`}
        emptyState={{
          icon: '📝',
          title: 'No form templates yet',
          description: 'Create your first form template to enable reporting.',
          actionLabel: 'Create Template',
          actionHref: '/dashboard/admin/forms/new',
        }}
      />
    </div>
  )
}
