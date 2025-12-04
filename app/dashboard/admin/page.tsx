import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ModulePlaceholder from '@/components/ModulePlaceholder'

export default async function AdminPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  // Check for admin access
  const permissions = user.role.permissions as Record<string, Record<string, boolean>> | null
  const hasAdminAccess = permissions?.admin?.access

  if (!hasAdminAccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <h1 className="text-xl font-bold text-red-900 mb-2">Access Denied</h1>
          <p className="text-red-800">
            You do not have permission to access the admin module.
            Please contact your facility administrator if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ModulePlaceholder
      title="Administration"
      description="Manage users, roles, facility settings, and system configuration"
      icon="⚙️"
      features={[
        'User management and role assignment',
        'Role and permission configuration',
        'Facility and rink settings',
        'Form template builder and editor',
        'Audit log viewer',
        'System configuration and integrations',
      ]}
    />
  )
}
