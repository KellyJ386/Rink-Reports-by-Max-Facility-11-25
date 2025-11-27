import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'admin', 'access')) {
    redirect('/dashboard')
  }

  const adminNav = [
    { label: 'Forms', href: '/dashboard/admin/forms', icon: '📝' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
    { label: 'Roles', href: '/dashboard/admin/roles', icon: '🔐' },
    { label: 'Rinks', href: '/dashboard/admin/rinks', icon: '🏟️' },
    { label: 'Ice Depth', href: '/dashboard/admin/ice-depth', icon: '❄️' },
    { label: 'Audit Log', href: '/dashboard/admin/audit-log', icon: '📋' },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-600 text-sm mt-1">Manage forms, users, and facility settings</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      {children}
    </div>
  )
}
