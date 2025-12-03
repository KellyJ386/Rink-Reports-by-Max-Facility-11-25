import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

const modules = [
  {
    id: 'iceDepth',
    name: 'Ice Depth',
    description: 'Track and monitor ice thickness measurements',
    href: '/dashboard/ice-depth',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    id: 'iceOperations',
    name: 'Ice Operations',
    description: 'Manage resurfacing and ice maintenance',
    href: '/dashboard/ice-operations',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: 'bg-cyan-500',
  },
  {
    id: 'refrigeration',
    name: 'Refrigeration',
    description: 'Monitor cooling system performance',
    href: '/dashboard/refrigeration',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'bg-indigo-500',
  },
  {
    id: 'airQuality',
    name: 'Air Quality',
    description: 'Track CO, NO2, and air quality metrics',
    href: '/dashboard/air-quality',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    color: 'bg-green-500',
  },
  {
    id: 'incidents',
    name: 'Incidents',
    description: 'Report and track facility incidents',
    href: '/dashboard/incidents',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'bg-amber-500',
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'View and manage rink schedules',
    href: '/dashboard/schedule',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-purple-500',
  },
  {
    id: 'dailyChecklist',
    name: 'Checklists',
    description: 'Complete daily operational checklists',
    href: '/dashboard/checklists',
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'bg-teal-500',
  },
]

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return null
  }

  const permissions = getUserPermissions(user)

  // Filter modules based on user permissions
  const accessibleModules = modules.filter((module) => {
    const modulePermissions = permissions[module.id as keyof typeof permissions]
    return modulePermissions && modulePermissions.access
  })

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          Select a module to get started
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {accessibleModules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="group block"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1">
              <div className={`${module.color} w-16 h-16 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {module.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {module.name}
              </h3>
              <p className="text-sm text-gray-500">
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {accessibleModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No modules available. Please contact your administrator.
          </p>
        </div>
      )}

      {/* Admin Link - Only show if user has admin access */}
      {permissions.admin?.access && (
        <div className="mt-10 text-center">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Settings
          </Link>
        </div>
      )}
    </div>
  )
}
