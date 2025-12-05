import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getAccessibleModules, canUserAccess } from '@/lib/permissions'
import { DashboardContent } from '@/components/dashboard'

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const accessibleModules = getAccessibleModules(user)
  const canApprove = canUserAccess(user, 'incidents', 'approve')

  return (
    <DashboardContent
      userName={user.firstName}
      facilityName={user.facility.name}
      roleName={user.role.name}
      accessibleModules={accessibleModules}
      canApprove={canApprove}
    />
  )
}
