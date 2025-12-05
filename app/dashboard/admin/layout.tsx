'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  const adminNavItems = [
    {
      label: 'Overview',
      href: '/dashboard/admin',
      icon: '📊'
    },
    {
      label: 'Form Templates',
      href: '/dashboard/admin/forms',
      icon: '📝'
    },
    {
      label: 'Users & Roles',
      href: '/dashboard/admin/users',
      icon: '👥'
    },
    {
      label: 'Facility Settings',
      href: '/dashboard/admin/settings',
      icon: '⚙️'
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Admin Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Manage forms, users, and facility settings</p>
      </div>

      {/* Admin Sub-navigation */}
      <div className="bg-white border-b px-6">
        <nav className="flex gap-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {children}
      </div>
    </div>
  )
}
