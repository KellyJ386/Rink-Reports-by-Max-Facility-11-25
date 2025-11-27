import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'
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

  const adminSections = [
    {
      title: 'Form Builder',
      description: 'Create and customize report templates',
      href: '/dashboard/admin/forms',
      icon: '📝',
      available: false,
    },
    {
      title: 'User Management',
      description: 'Manage staff accounts and permissions',
      href: '/dashboard/admin/users',
      icon: '👥',
      available: false,
    },
    {
      title: 'Roles & Permissions',
      description: 'Configure role-based access control',
      href: '/dashboard/admin/roles',
      icon: '🔐',
      available: false,
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility preferences',
      href: '/dashboard/admin/settings',
      icon: '🏢',
      available: false,
    },
    {
      title: 'Rink Configuration',
      description: 'Manage rinks and ice depth diagrams',
      href: '/dashboard/admin/rinks',
      icon: '🏒',
      available: false,
    },
    {
      title: 'Data Retention',
      description: 'Configure data retention policies',
      href: '/dashboard/admin/retention',
      icon: '📦',
      available: false,
    },
    {
      title: 'Notifications',
      description: 'Email and SMS notification settings',
      href: '/dashboard/admin/notifications',
      icon: '🔔',
      available: false,
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and changes',
      href: '/dashboard/admin/audit',
      icon: '📋',
      available: false,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600 mt-1">Manage facility settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <div
            key={section.title}
            className={`card hover:shadow-lg transition-shadow ${
              !section.available ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{section.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                {section.available ? (
                  <Link
                    href={section.href}
                    className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Manage →
                  </Link>
                ) : (
                  <span className="inline-block mt-3 text-sm text-gray-400">
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h2 className="text-xl font-bold mb-2">Admin Module Status</h2>
        <p className="text-gray-700">
          The admin module will include a drag-and-drop form builder, user management,
          and facility configuration. This is scheduled for <strong>Phase 2-3</strong>.
        </p>
      </div>
    </div>
  )
}
