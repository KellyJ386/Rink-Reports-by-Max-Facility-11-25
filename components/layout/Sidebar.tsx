'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-center">
          <Image
            src="/logo-white.svg"
            alt="Max Facility - Rink Reports"
            width={160}
            height={112}
            priority
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">{user.facility.name}</p>
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
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
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
      <div className="p-4 border-t border-gray-800">
        <div className="mb-3">
          <p className="text-sm font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-400">{user.role.name}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
