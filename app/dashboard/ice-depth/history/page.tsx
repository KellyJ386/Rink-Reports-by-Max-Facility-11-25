import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import IceDepthHistory from './IceDepthHistory'

export default async function IceDepthHistoryPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  // Check if user has access to view ice depth history
  const canViewAll = canUserAccess(user, 'iceDepth', 'viewAll')
  const canViewOwn = canUserAccess(user, 'iceDepth', 'viewOwn')

  if (!canViewAll && !canViewOwn) {
    redirect('/dashboard/ice-depth')
  }

  const userData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    facilityId: user.facilityId,
    canViewAll,
    canExport: canUserAccess(user, 'iceDepth', 'export'),
  }

  return <IceDepthHistory user={userData} />
}
