import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'admin', 'access')) {
    redirect('/dashboard')
  }

  const canEdit = canUserAccess(user, 'admin', 'edit')

  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { isSystemDefault: true },
        { facilityId: user.facilityId },
      ],
    },
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage access levels and permissions for your team
          </p>
        </div>
        {canEdit && (
          <Link href="/dashboard/admin/roles/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Role
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {roles.map((role) => {
          const permissions = role.permissions as any
          const moduleCount = Object.keys(permissions || {}).filter(
            (k) => permissions[k]?.access
          ).length

          return (
            <div key={role.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                    {role.isSystemDefault && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        System Default
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-gray-600 text-sm mt-1">{role.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>{role._count.users} user{role._count.users !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{moduleCount} module{moduleCount !== 1 ? 's' : ''} accessible</span>
                  </div>
                </div>
                <Link
                  href={`/dashboard/admin/roles/${role.id}`}
                  className="btn btn-secondary text-sm"
                >
                  {canEdit && !role.isSystemDefault ? 'Edit' : 'View'}
                </Link>
              </div>

              {/* Permission Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(permissions || {}).map(([module, perms]: [string, any]) => {
                    if (!perms?.access) return null
                    const permCount = Object.values(perms).filter(Boolean).length - 1
                    return (
                      <span
                        key={module}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        title={`${permCount} permissions enabled`}
                      >
                        {module.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
