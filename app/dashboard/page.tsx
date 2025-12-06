'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ModuleConfig {
  id: string
  name: string
  description: string
  icon: string
  href: string
  color: string
  bgColor: string
  permissionKey: string
}

const MODULES: ModuleConfig[] = [
  {
    id: 'ice-depth',
    name: 'Ice Depth',
    description: 'Monitor and record ice thickness measurements',
    icon: '📏',
    href: '/dashboard/ice-depth',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
    permissionKey: 'iceDepth'
  },
  {
    id: 'ice-operations',
    name: 'Ice Operations',
    description: 'Track resurfacing and ice maintenance',
    icon: '🏒',
    href: '/dashboard/ice-operations',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    permissionKey: 'iceOperations'
  },
  {
    id: 'refrigeration',
    name: 'Refrigeration',
    description: 'Monitor cooling systems and temperatures',
    icon: '❄️',
    href: '/dashboard/refrigeration',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
    permissionKey: 'refrigeration'
  },
  {
    id: 'air-quality',
    name: 'Air Quality',
    description: 'Track CO and NO2 levels for safety',
    icon: '🌡️',
    href: '/dashboard/air-quality',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    permissionKey: 'airQuality'
  },
  {
    id: 'incidents',
    name: 'Incidents',
    description: 'Report and track safety incidents',
    icon: '⚠️',
    href: '/dashboard/incidents',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    permissionKey: 'incidents'
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Manage staff shifts and coverage',
    icon: '📅',
    href: '/dashboard/schedule',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    permissionKey: 'schedule'
  },
  {
    id: 'checklists',
    name: 'Daily Checklists',
    description: 'Complete daily operational checklists',
    icon: '✓',
    href: '/dashboard/checklists',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    permissionKey: 'dailyChecklist'
  }
]

interface DashboardData {
  permissions: Record<string, { access?: boolean }>
  stats: {
    unreadNotifications: number
    openShifts: number
    todayShifts: number
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user permissions and basic stats
        const [meResponse, statsResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard/stats')
        ])

        if (meResponse.ok) {
          const meData = await meResponse.json()
          const statsData = statsResponse.ok ? await statsResponse.json() : {}

          setData({
            permissions: meData.permissions || {},
            stats: {
              unreadNotifications: statsData.notifications?.unread || 0,
              openShifts: statsData.schedule?.openShifts || 0,
              todayShifts: statsData.schedule?.todayShifts || 0
            }
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const accessibleModules = MODULES.filter(
    module => data?.permissions[module.permissionKey]?.access
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Rink Reports</h1>
        <p className="text-gray-500 mt-2">Select a module to get started</p>
      </div>

      {/* Quick Stats Bar */}
      {data?.stats && (data.stats.unreadNotifications > 0 || data.stats.openShifts > 0) && (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {data.stats.unreadNotifications > 0 && (
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {data.stats.unreadNotifications} unread notification{data.stats.unreadNotifications !== 1 ? 's' : ''}
            </Link>
          )}
          {data.stats.openShifts > 0 && (
            <Link
              href="/dashboard/schedule/open-shifts"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              <span className="text-lg">🆘</span>
              {data.stats.openShifts} open shift{data.stats.openShifts !== 1 ? 's' : ''} need coverage
            </Link>
          )}
        </div>
      )}

      {/* Module Grid */}
      {accessibleModules.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accessibleModules.map((module) => (
            <Link
              key={module.id}
              href={module.href}
              className={`group relative block p-8 rounded-2xl border-2 transition-all duration-200 ${module.bgColor} hover:shadow-lg hover:scale-[1.02]`}
            >
              <div className="text-center">
                <span className="text-5xl block mb-4 group-hover:scale-110 transition-transform">
                  {module.icon}
                </span>
                <h2 className={`text-xl font-bold ${module.color} mb-2`}>
                  {module.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {module.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className={`w-6 h-6 ${module.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <span className="text-4xl block mb-4">🔒</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Access</h2>
          <p className="text-gray-500">
            You don&apos;t have access to any modules yet.<br />
            Contact your administrator to request access.
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Link
          href="/dashboard/notifications"
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-xl">🔔</span>
          <span>Notifications</span>
        </Link>
        {data?.permissions.schedule?.access && (
          <Link
            href="/dashboard/schedule/my-schedule"
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">📋</span>
            <span>My Schedule</span>
          </Link>
        )}
      </div>
    </div>
  )
}
