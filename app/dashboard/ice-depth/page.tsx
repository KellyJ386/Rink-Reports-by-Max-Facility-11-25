import { getSession } from '@/lib/auth'
import { getUserPermissions, canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import IceDepthDashboard from './IceDepthDashboard'

export default async function IceDepthPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const permissions = getUserPermissions(user)

  // Check if user has access to ice depth module
  if (!canUserAccess(user, 'iceDepth', 'access')) {
    redirect('/dashboard')
  }

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    facilityId: user.facilityId,
    permissions,
  }

  return <IceDepthDashboard user={userData} />
}
