import { getSession } from '@/lib/auth'
import { getUserPermissions, getAccessibleModules } from '@/lib/permissions'

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return null
  }

  const _permissions = getUserPermissions(user)
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
        <h2 className="text-xl font-bold mb-2">🚧 Development Status</h2>
        <p className="text-gray-700 mb-4">
          <strong>Phase 1: Foundation - Complete!</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>✅ Next.js project initialized</li>
          <li>✅ Prisma database schema configured</li>
          <li>✅ Authentication system implemented</li>
          <li>✅ Role-based access control</li>
          <li>✅ Basic dashboard layout</li>
        </ul>
        <p className="mt-4 text-sm text-gray-600">
          Next up: Form Builder and Report Modules!
        </p>
      </div>
    </div>
  )
}
