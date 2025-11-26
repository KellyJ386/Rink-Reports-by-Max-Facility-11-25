import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, DataTable, StatusBadge } from '@/components/shared'
import type { Column } from '@/components/shared'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  lastLoginAt: Date | null
  role: { name: string }
  createdAt: Date
}

export default async function UsersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const users = await prisma.user.findMany({
    where: { facilityId: session.user.facilityId },
    include: {
      role: { select: { name: true } },
    },
    orderBy: { lastName: 'asc' },
  })

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => row.role.name,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => row.phone || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (row) =>
        row.lastLoginAt
          ? new Date(row.lastLoginAt).toLocaleDateString()
          : 'Never',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage user accounts"
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
        actions={
          <Link href="/dashboard/admin/users/new" className="btn btn-primary">
            + Add User
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        keyField="id"
        rowHref={(row) => `/dashboard/admin/users/${row.id}`}
        emptyState={{
          icon: '👥',
          title: 'No users found',
          description: 'Add your first user to get started.',
          actionLabel: 'Add User',
          actionHref: '/dashboard/admin/users/new',
        }}
      />
    </div>
  )
}
