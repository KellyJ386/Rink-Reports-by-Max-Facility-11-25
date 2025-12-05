import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { SubmissionsList } from '@/components/reports'

export default async function IncidentsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const canViewOwn = canUserAccess(user, 'incidents', 'viewOwn')
  const canViewAll = canUserAccess(user, 'incidents', 'viewAll')

  if (!canViewOwn && !canViewAll) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
        <p className="text-gray-600 mt-1">
          Document and track all facility incidents, injuries, and safety concerns
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-gray-900">-</p>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Ambulance Called (This Month)</p>
          <p className="text-2xl font-bold text-gray-900">-</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total This Month</p>
          <p className="text-2xl font-bold text-gray-900">-</p>
        </div>
      </div>

      <SubmissionsList
        moduleType="INCIDENT"
        baseUrl="/dashboard/incidents"
        title="Incident Reports"
      />
    </div>
  )
}
