import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader, DataTable } from '@/components/shared'
import type { Column } from '@/components/shared'

interface Role {
  id: string
  name: string
  description: string | null
  isSystemDefault: boolean
  _count: { users: number }
  permissions: any
}

export default async function RolesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { facilityId: session.user.facilityId },
        { isSystemDefault: true },
      ],
    },
    include: {
      _count: { select: { users: true } },
    },
    orderBy: { name: 'asc' },
  })

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Role Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.name}</span>
          {row.isSystemDefault && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              System
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description || '—',
    },
    {
      key: 'users',
      header: 'Users',
      render: (row) => row._count.users,
    },
    {
      key: 'permissions',
      header: 'Modules',
      render: (row) => {
        const perms = row.permissions as any
        const moduleCount = Object.keys(perms || {}).filter(
          (k) => perms[k]?.access
        ).length
        return `${moduleCount} modules`
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Manage user roles and permissions"
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
      />

      <DataTable
        columns={columns}
        data={roles}
        keyField="id"
        rowHref={(row) => `/dashboard/admin/roles/${row.id}`}
        emptyState={{
          icon: '🔐',
          title: 'No roles found',
          description: 'Roles are created during initial setup.',
        }}
      />

      {/* Permissions Reference */}
      <div className="mt-8 bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Permission Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">access</p>
            <p className="text-gray-500">Can view module</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">submit</p>
            <p className="text-gray-500">Can submit reports</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">viewOwn</p>
            <p className="text-gray-500">Can view own submissions</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">viewAll</p>
            <p className="text-gray-500">Can view all submissions</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">edit</p>
            <p className="text-gray-500">Can edit submissions</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">delete</p>
            <p className="text-gray-500">Can delete submissions</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">approve</p>
            <p className="text-gray-500">Can approve/reject</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">export</p>
            <p className="text-gray-500">Can export data</p>
          </div>
        </div>
      </div>
    </div>
  )
}
