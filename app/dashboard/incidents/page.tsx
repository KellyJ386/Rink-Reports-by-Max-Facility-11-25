import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function IncidentsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'incidents', 'access')) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
          <p className="text-gray-600 mt-1">Report and track facility incidents</p>
        </div>
        <button className="btn btn-primary">Report Incident</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Open Incidents</h3>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-3xl font-bold text-yellow-600">--</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500">This Month</h3>
          <p className="text-3xl font-bold text-gray-900">--</p>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Incident Reporting Module</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Document accidents and incidents with body diagrams, witness information,
            and photo attachments. Track ambulance calls and manager approvals.
          </p>
          <p className="text-sm text-blue-600 mt-4">Coming in Phase 6</p>
        </div>
      </div>
    </div>
  )
}
