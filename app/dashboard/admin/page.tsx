import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import Link from 'next/link'

export default async function AdminPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'admin', 'access')) {
    redirect('/dashboard')
  }

  const adminModules = [
    {
      name: 'Form Templates',
      description: 'Create and manage form templates for all modules',
      href: '/dashboard/admin/forms',
      icon: '📝',
      permission: 'manageForms',
    },
    {
      name: 'User Management',
      description: 'Manage staff accounts and access',
      href: '/dashboard/admin/users',
      icon: '👥',
      permission: 'manageUsers',
    },
    {
      name: 'Role Management',
      description: 'Configure roles and permission sets',
      href: '/dashboard/admin/roles',
      icon: '🔐',
      permission: 'manageRoles',
    },
    {
      name: 'Rink Configuration',
      description: 'Manage rinks, surfaces, and ice depth settings',
      href: '/dashboard/admin/rinks',
      icon: '🏟️',
      permission: 'manageSettings',
    },
    {
      name: 'Facility Settings',
      description: 'Configure facility info, thresholds, and SMS',
      href: '/dashboard/admin/settings',
      icon: '⚙️',
      permission: 'manageSettings',
    },
    {
      name: 'Audit Logs',
      description: 'View system audit trail and activity logs',
      href: '/dashboard/admin/audit',
      icon: '📋',
      permission: 'viewAll',
    },
  ]

  // Filter modules based on user permissions
  const accessibleModules = adminModules.filter((module) =>
    canUserAccess(user, 'admin', module.permission as any)
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-600 mt-1">
          Manage your facility settings, users, and form templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleModules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{module.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {accessibleModules.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-600">
            You don&apos;t have access to any admin features.
          </p>
        </div>
      )}
    </div>
  )
}
