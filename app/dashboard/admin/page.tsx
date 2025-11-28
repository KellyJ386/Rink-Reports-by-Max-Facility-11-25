import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
      title: 'Form Templates',
      description: 'Create and manage form templates for all modules',
      href: '/dashboard/admin/forms',
      icon: '📋',
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/dashboard/admin/users',
      icon: '👥',
      comingSoon: true,
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility-wide settings and thresholds',
      href: '/dashboard/admin/settings',
      icon: '⚙️',
      comingSoon: true,
    },
    {
      title: 'Data Retention',
      description: 'Configure data retention policies',
      href: '/dashboard/admin/retention',
      icon: '🗄️',
      comingSoon: true,
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin</h1>
      <p className="text-gray-600 mb-8">
        Manage your facility settings, users, and form templates.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module) => (
          <div key={module.title} className="relative">
            {module.comingSoon ? (
              <div className="card opacity-60">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{module.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {module.description}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <Link href={module.href} className="block card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{module.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {module.description}
                    </p>
                    <span className="inline-block mt-2 text-blue-600 text-sm font-medium">
                      Manage →
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
