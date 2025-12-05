import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { SubmissionsList } from '@/components/reports'

export default async function IceOperationsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  // Check if user can at least view their own ice operations submissions
  const canViewOwn = canUserAccess(user, 'iceOperations', 'viewOwn')
  const canViewAll = canUserAccess(user, 'iceOperations', 'viewAll')

  if (!canViewOwn && !canViewAll) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ice Operations</h1>
        <p className="text-gray-600 mt-1">
          Track resurfacing, edging, and ice maintenance activities
        </p>
      </div>

      <SubmissionsList
        moduleType="ICE_OPERATIONS"
        baseUrl="/dashboard/ice-operations"
        title="Ice Operations Reports"
      />
    </div>
  )
}
