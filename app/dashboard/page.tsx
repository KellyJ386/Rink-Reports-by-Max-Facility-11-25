import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

const MODULES = [
  { key: 'iceDepth', label: 'Ice Depth', href: '/dashboard/ice-depth', icon: '📏', color: 'blue' },
  { key: 'iceOperations', label: 'Ice Operations', href: '/dashboard/ice-operations', icon: '🏒', color: 'cyan' },
  { key: 'refrigeration', label: 'Refrigeration', href: '/dashboard/refrigeration', icon: '❄️', color: 'indigo' },
  { key: 'airQuality', label: 'Air Quality', href: '/dashboard/air-quality', icon: '🌡️', color: 'teal' },
  { key: 'incidents', label: 'Incidents', href: '/dashboard/incidents', icon: '⚠️', color: 'red' },
  { key: 'schedule', label: 'Schedule', href: '/dashboard/schedule', icon: '📅', color: 'purple' },
  { key: 'dailyChecklist', label: 'Checklists', href: '/dashboard/checklists', icon: '✓', color: 'green' },
]

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
}

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return null
  }

  const permissions = getUserPermissions(user)

  // Get accessible modules
  const accessibleModules = MODULES.filter((module) => {
    const perm = (permissions as any)[module.key]
    return perm?.access
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          {user.facility.name} • {user.role.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Today's Date</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Current Time</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-gray-500">Local time</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Your Role</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{user.role.name}</div>
          <div className="text-sm text-gray-500">{accessibleModules.length} modules</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Facility</div>
          <div className="text-xl font-bold text-gray-900 mt-1 truncate">{user.facility.name}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
      </div>

      {/* Module Quick Access */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {accessibleModules.map((module) => {
            const colors = COLOR_CLASSES[module.color]
            return (
              <Link
                key={module.key}
                href={module.href}
                className={`${colors.bg} border ${colors.border} rounded-xl p-4 hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <div className={`font-semibold ${colors.text} group-hover:underline`}>
                      {module.label}
                    </div>
                    <div className="text-xs text-gray-500">Submit report</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Admin Section */}
      {permissions.admin?.access && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Administration</h2>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/admin/forms"
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium text-gray-900">Form Builder</div>
                <div className="text-xs text-gray-500">Manage templates</div>
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-medium text-gray-900">Users</div>
                <div className="text-xs text-gray-500">Manage staff</div>
              </Link>
              <Link
                href="/dashboard/admin/roles"
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">🔐</div>
                <div className="font-medium text-gray-900">Roles</div>
                <div className="text-xs text-gray-500">Permissions</div>
              </Link>
              <Link
                href="/dashboard/submissions"
                className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium text-gray-900">Submissions</div>
                <div className="text-xs text-gray-500">View all reports</div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>View your recent submissions in the Submissions page</span>
            </div>
            <Link
              href="/dashboard/submissions"
              className="inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all submissions →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Use the sidebar to navigate between modules</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>All reports require selecting a rink first</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Incident reports require manager approval</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
