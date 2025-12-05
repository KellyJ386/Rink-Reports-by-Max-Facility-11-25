'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ScheduleLayoutProps {
  children: React.ReactNode
}

export default function ScheduleLayout({ children }: ScheduleLayoutProps) {
  const pathname = usePathname()

  const scheduleNavItems = [
    {
      label: 'Overview',
      href: '/dashboard/schedule',
      icon: '📊'
    },
    {
      label: 'My Schedule',
      href: '/dashboard/schedule/my-schedule',
      icon: '👤'
    },
    {
      label: 'Open Shifts',
      href: '/dashboard/schedule/open-shifts',
      icon: '🔔'
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Schedule Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage employee schedules</p>
      </div>

      {/* Schedule Sub-navigation */}
      <div className="bg-white border-b px-6">
        <nav className="flex gap-1">
          {scheduleNavItems.map((item) => {
            const isActive = pathname === item.href

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
