import { getSession } from '@/lib/auth'
import { getAccessibleModules, canUserAccess } from '@/lib/permissions'
import DashboardClient from '@/components/dashboard/DashboardClient'

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    return null
  }

  const accessibleModules = getAccessibleModules(user)
  const isAdmin = canUserAccess(user, 'admin', 'access')

  return (
    <DashboardClient
      user={{
        firstName: user.firstName,
        facilityName: user.facility.name,
        roleName: user.role.name,
        isAdmin,
      }}
      accessibleModules={accessibleModules}
    />
  )
}
