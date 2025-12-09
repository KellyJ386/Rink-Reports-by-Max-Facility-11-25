'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  user: {
    firstName: string
    lastName: string
    role: { name: string }
    facility: { name: string }
    permissions: any
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      show: true,
    },
    {
      label: 'Submissions',
      href: '/dashboard/submissions',
      icon: '📋',
      show: true, // All users can view submissions (permissions checked in API)
    },
    {
      label: 'Ice Depth',
      href: '/dashboard/ice-depth',
      icon: '📏',
      show: user.permissions.iceDepth?.access,
    },
    {
      label: 'Ice Operations',
      href: '/dashboard/ice-operations',
      icon: '🏒',
      show: user.permissions.iceOperations?.access,
    },
    {
      label: 'Refrigeration',
      href: '/dashboard/refrigeration',
      icon: '❄️',
      show: user.permissions.refrigeration?.access,
    },
    {
      label: 'Air Quality',
      href: '/dashboard/air-quality',
      icon: '🌡️',
      show: user.permissions.airQuality?.access,
    },
    {
      label: 'Incidents',
      href: '/dashboard/incidents',
      icon: '⚠️',
      show: user.permissions.incidents?.access,
    },
    {
      label: 'Schedule',
      href: '/dashboard/schedule',
      icon: '📅',
      show: user.permissions.schedule?.access,
    },
    {
      label: 'Checklists',
      href: '/dashboard/checklists',
      icon: '✓',
      show: user.permissions.dailyChecklist?.access,
    },
    {
      label: 'Admin',
      href: '/dashboard/admin',
      icon: '⚙️',
      show: user.permissions.admin?.access,
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <div className="w-64 bg-navy text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-navy-600">
        <h1 className="text-2xl font-bold text-white">MFO</h1>
        <p className="text-xs text-wolf-300 mt-1">{user.facility.name}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-action text-white font-semibold'
                      : 'text-wolf-200 hover:bg-navy-600 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-navy-600">
        <div className="mb-3">
          <p className="text-sm font-medium text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-wolf-300">{user.role.name}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full px-4 py-2 text-sm bg-navy-600 hover:bg-navy-500 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
