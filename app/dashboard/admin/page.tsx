import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { redirect } from 'next/navigation'

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
      title: 'Form Templates',
      description: 'Create and manage form templates for all modules',
      href: '/dashboard/admin/form-templates',
      icon: '📝',
      enabled: permissions.admin?.editForms,
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      href: '/dashboard/admin/users',
      icon: '👥',
      enabled: permissions.admin?.editUsers,
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility settings and thresholds',
      href: '/dashboard/admin/settings',
      icon: '⚙️',
      enabled: permissions.admin?.editSettings,
    },
    {
      title: 'Rink Configuration',
      description: 'Manage rinks and ice depth measurement points',
      href: '/dashboard/admin/rinks',
      icon: '🏒',
      enabled: permissions.admin?.editSettings,
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and audit trail',
      href: '/dashboard/admin/audit-logs',
      icon: '📋',
      enabled: true,
    },
  ]

  const enabledSections = adminSections.filter((s) => s.enabled)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
      <p className="text-gray-600 mb-8">
        Manage your facility settings, users, and form templates
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{section.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {enabledSections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>You don&apos;t have access to any admin sections.</p>
        </div>
      )}
    </div>
  )
}
