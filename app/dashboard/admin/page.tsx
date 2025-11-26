import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

export default async function AdminPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const permissions = getUserPermissions(user)

  if (!permissions.admin?.access) {
    redirect('/dashboard')
  }

  const adminSections = [
    {
      title: 'Form Builder',
      description: 'Create and manage custom form templates for each module',
      href: '/dashboard/admin/forms',
      icon: '📝',
      permission: permissions.admin?.createTemplates,
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/dashboard/admin/users',
      icon: '👥',
      permission: permissions.admin?.access,
      comingSoon: true,
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility-wide settings and thresholds',
      href: '/dashboard/admin/settings',
      icon: '⚙️',
      permission: permissions.admin?.access,
      comingSoon: true,
    },
    {
      title: 'Data Retention',
      description: 'Manage data retention policies and archival',
      href: '/dashboard/admin/retention',
      icon: '🗄️',
      permission: permissions.admin?.access,
      comingSoon: true,
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
      <p className="text-gray-600 mb-8">
        Manage your facility settings, users, and form templates
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections
          .filter((section) => section.permission)
          .map((section) => (
            <Link
              key={section.href}
              href={section.comingSoon ? '#' : section.href}
              className={`card hover:shadow-md transition-shadow ${
                section.comingSoon ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{section.icon}</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.title}
                    {section.comingSoon && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        Coming Soon
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}
