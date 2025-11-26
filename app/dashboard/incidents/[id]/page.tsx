import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PageHeader, StatusBadge } from '@/components/shared'
import { UniversalHeaderView } from '@/components/forms'
import IncidentBodyDiagram from './IncidentBodyDiagram'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'INCIDENT',
      },
    },
    include: {
      rink: true,
      submittedBy: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  if (!submission) notFound()

  const data = submission.data as any

  const typeLabels: Record<string, string> = {
    injury: 'Injury',
    near_miss: 'Near Miss',
    property_damage: 'Property Damage',
    medical_emergency: 'Medical Emergency',
    other: 'Other',
  }

  const severityConfig: Record<string, { label: string; color: string }> = {
    minor: { label: 'Minor', color: 'bg-yellow-100 text-yellow-800' },
    moderate: { label: 'Moderate', color: 'bg-orange-100 text-orange-800' },
    severe: { label: 'Severe', color: 'bg-red-100 text-red-800' },
  }

  const severity = severityConfig[data.severity] || severityConfig.minor

  return (
    <div>
      <PageHeader
        title="Incident Report"
        backHref="/dashboard/incidents"
        backLabel="Back to Incidents"
        actions={<StatusBadge status={submission.status} size="md" />}
      />

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <UniversalHeaderView
          rinkName={submission.rink.name}
          submittedAt={submission.submittedAt}
          submittedBy={`${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`}
        />

        {/* Incident Summary */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Incident Type</p>
              <p className="font-medium">{typeLabels[data.incidentType] || data.incidentType}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Severity</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${severity.color}`}>
                {severity.label}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Time of Incident</p>
              <p className="font-medium">{data.incidentTime || '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium">{data.locationDetail || '—'}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Incident Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
        </div>

        {/* Ambulance Alert */}
        {data.ambulanceCalled && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚑</span>
              <div>
                <p className="font-medium text-red-800">Ambulance Called</p>
                {data.ambulanceTime && (
                  <p className="text-sm text-red-700">Time called: {data.ambulanceTime}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Injured Person */}
        {data.injuredPerson && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Injured Person</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium">{data.injuredPerson.name || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium">{data.injuredPerson.phone || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Age</p>
                <p className="font-medium">{data.injuredPerson.age || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium capitalize">{data.injuredPerson.type?.replace('_', ' ') || '—'}</p>
              </div>
            </div>

            {/* Body Diagram */}
            {data.injuryLocations && data.injuryLocations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Injury Locations</h4>
                <IncidentBodyDiagram markers={data.injuryLocations} />
              </div>
            )}
          </div>
        )}

        {/* Treatment */}
        {data.treatmentProvided && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Treatment Provided</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.treatmentProvided}</p>
          </div>
        )}

        {/* Witness */}
        {data.witness && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Witness Information</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium">{data.witness.name || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium">{data.witness.phone || '—'}</p>
              </div>
            </div>
            {data.witness.statement && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Statement</p>
                <p className="text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">
                  {data.witness.statement}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions & Follow-up */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Actions & Follow-up</h3>
          {data.actionsTaken && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Actions Taken</p>
              <p className="text-gray-700 whitespace-pre-wrap">{data.actionsTaken}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.followUpRequired
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {data.followUpRequired ? '⚠️ Follow-up Required' : '✓ No Follow-up Required'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6 text-xs text-gray-400">
          <p>Submission ID: {submission.id}</p>
        </div>
      </div>
    </div>
  )
}
