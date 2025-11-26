import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { getUserPermissions, getAccessibleModules } from '@/lib/permissions'

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return null
  }

  const permissions = getUserPermissions(user)
  const accessibleModules = getAccessibleModules(user)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user.firstName}!
      </h1>
      <p className="text-gray-600 mb-8">
        {user.facility.name} • {user.role.name}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
          <p className="text-gray-600 text-sm">
            Coming soon: Recent submissions, pending approvals, and more.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <p className="text-gray-600 text-sm">
            Coming soon: Your recent reports and actions.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Alerts</h3>
          <p className="text-gray-600 text-sm">
            Coming soon: Air quality alerts, incident notifications, and more.
          </p>
        </div>
      </div>

      {/* Quick Actions for Admin */}
      {permissions.admin?.createTemplates && (
        <div className="card mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h2 className="text-xl font-bold mb-4">Admin Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard/admin/forms"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span>📝</span>
              <span className="font-medium text-gray-800">Form Builder</span>
            </Link>
            <Link
              href="/dashboard/admin/forms/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>+</span>
              <span className="font-medium">New Form Template</span>
            </Link>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Your Access</h2>
        <p className="text-gray-600 mb-4">
          You have access to the following modules:
        </p>
        <div className="flex flex-wrap gap-2">
          {accessibleModules.map((module) => (
            <span
              key={module}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {module}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h2 className="text-xl font-bold mb-2">Development Status</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-700 font-medium">Phase 1: Foundation</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mt-2">
              <li>Next.js project with TypeScript</li>
              <li>Prisma database schema</li>
              <li>JWT authentication</li>
              <li>Role-based access control</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Phase 2: Form Builder Core</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mt-2">
              <li>Drag-and-drop form canvas</li>
              <li>Field type components</li>
              <li>Field configuration panel</li>
              <li>Form template CRUD</li>
              <li>Form preview mode</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Coming Next: Phase 3 - Form Builder Advanced</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-400 mt-2">
              <li>Conditional logic builder</li>
              <li>Calculated fields</li>
              <li>Specialized fields (ice depth grid, body diagram)</li>
              <li>Form versioning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
