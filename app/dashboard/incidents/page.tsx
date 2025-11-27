import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return { label: 'Critical', color: 'bg-red-600 text-white' }
    case 'major':
      return { label: 'Major', color: 'bg-orange-500 text-white' }
    case 'minor':
      return { label: 'Minor', color: 'bg-yellow-500 text-white' }
    default:
      return { label: 'Low', color: 'bg-blue-500 text-white' }
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'injury':
      return { label: 'Injury', color: 'bg-red-100 text-red-800' }
    case 'property_damage':
      return { label: 'Property Damage', color: 'bg-orange-100 text-orange-800' }
    case 'near_miss':
      return { label: 'Near Miss', color: 'bg-yellow-100 text-yellow-800' }
    case 'safety_hazard':
      return { label: 'Safety Hazard', color: 'bg-purple-100 text-purple-800' }
    default:
      return { label: 'Other', color: 'bg-gray-100 text-gray-800' }
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return { label: 'Open', color: 'bg-blue-100 text-blue-800' }
    case 'PENDING_REVIEW':
      return { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' }
    case 'APPROVED':
      return { label: 'Resolved', color: 'bg-green-100 text-green-800' }
    case 'REJECTED':
      return { label: 'Closed', color: 'bg-gray-100 text-gray-800' }
    default:
      return { label: 'Draft', color: 'bg-gray-100 text-gray-800' }
  }
}

export default async function IncidentsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'incidents', 'access')) {
    redirect('/dashboard')
  }

  const canSubmit = canUserAccess(user, 'incidents', 'submit')
  const canViewAll = canUserAccess(user, 'incidents', 'viewAll')

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'INCIDENT',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 100,
  })

  // Calculate stats
  const stats = {
    total: submissions.length,
    open: submissions.filter((s) => s.status === 'SUBMITTED').length,
    injuries: submissions.filter((s) => (s.data as any)?.incidentType === 'injury').length,
    ambulanceCalls: submissions.filter((s) => (s.data as any)?.ambulanceCalled).length,
  }

  // Recent critical incidents
  const criticalIncidents = submissions
    .filter((s) => (s.data as any)?.severity === 'critical' || (s.data as any)?.ambulanceCalled)
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
          <p className="text-gray-600 text-sm mt-1">Track and manage facility incidents</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/incidents/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Report Incident
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Incidents</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.open}</div>
          <div className="text-sm text-gray-500">Open Cases</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.injuries}</div>
          <div className="text-sm text-gray-500">Injuries</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.ambulanceCalls}</div>
          <div className="text-sm text-gray-500">Ambulance Calls</div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalIncidents.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Critical Incidents</h3>
              <p className="text-red-700 text-sm mb-2">
                {criticalIncidents.length} critical incident{criticalIncidents.length > 1 ? 's' : ''} requiring attention
              </p>
              <div className="space-y-1">
                {criticalIncidents.map((incident) => (
                  <Link
                    key={incident.id}
                    href={`/dashboard/incidents/${incident.id}`}
                    className="block text-sm text-red-700 hover:text-red-900 underline"
                  >
                    {new Date(incident.submittedAt).toLocaleDateString()} - {(incident.data as any)?.involvedPersonName || 'Unknown'} - {incident.rink.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Incidents</h2>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No incidents reported yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Person Involved</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Severity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const data = s.data as any
                  const typeBadge = getTypeBadge(data?.incidentType || '')
                  const severityBadge = getSeverityBadge(data?.severity || '')
                  const statusBadge = getStatusBadge(s.status)

                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{new Date(s.submittedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                        {data?.ambulanceCalled && (
                          <span className="ml-1 text-red-600" title="Ambulance Called">🚑</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{data?.involvedPersonName || 'Not specified'}</div>
                        <div className="text-xs text-gray-500 capitalize">{data?.involvedPersonType || ''}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{s.rink.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${severityBadge.color}`}>
                          {severityBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/incidents/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
