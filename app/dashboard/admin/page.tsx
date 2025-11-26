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
      description: 'Manage users and assign roles',
      href: '/dashboard/admin/users',
      icon: '👥',
      permission: permissions.admin?.manageUsers || permissions.admin?.access,
    },
    {
      title: 'Role Management',
      description: 'Configure roles and permissions',
      href: '/dashboard/admin/roles',
      icon: '🔐',
      permission: permissions.admin?.manageRoles || permissions.admin?.access,
    },
    {
      title: 'All Submissions',
      description: 'View and manage all form submissions',
      href: '/dashboard/submissions',
      icon: '📊',
      permission: permissions.admin?.access,
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
              href={section.href}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{section.icon}</div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {section.title}
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
