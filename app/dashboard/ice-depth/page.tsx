import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { SubmissionsList } from '@/components/reports'

export default async function IceDepthPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  // Check if user can at least view their own ice depth submissions
  const canViewOwn = canUserAccess(user, 'iceDepth', 'viewOwn')
  const canViewAll = canUserAccess(user, 'iceDepth', 'viewAll')

  if (!canViewOwn && !canViewAll) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ice Depth Monitoring</h1>
        <p className="text-gray-600 mt-1">
          Track and monitor ice thickness measurements across all rinks
        </p>
      </div>

      <SubmissionsList
        moduleType="ICE_DEPTH"
        baseUrl="/dashboard/ice-depth"
        title="Ice Depth Reports"
      />
    </div>
  )
}
