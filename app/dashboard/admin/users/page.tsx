import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'admin', 'access')) {
    redirect('/dashboard')
  }

  const canEdit = canUserAccess(user, 'admin', 'edit')

  const users = await prisma.user.findMany({
    where: { facilityId: user.facilityId },
    include: {
      role: { select: { id: true, name: true } },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  const roles = await prisma.role.findMany({
    where: {
      OR: [{ isSystemDefault: true }, { facilityId: user.facilityId }],
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} user{users.length !== 1 ? 's' : ''} in your facility
          </p>
        </div>
        {canEdit && (
          <Link href="/dashboard/admin/users/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Login</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">
                    {u.firstName} {u.lastName}
                  </div>
                  {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {u.role.name}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/dashboard/admin/users/${u.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {canEdit ? 'Edit' : 'View'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
