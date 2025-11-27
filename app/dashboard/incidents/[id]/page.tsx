import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const BODY_PARTS_LABELS: Record<string, string> = {
  head: 'Head',
  face: 'Face',
  neck: 'Neck',
  left_shoulder: 'Left Shoulder',
  right_shoulder: 'Right Shoulder',
  chest: 'Chest',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  abdomen: 'Abdomen',
  left_hand: 'Left Hand',
  right_hand: 'Right Hand',
  groin: 'Groin/Hip',
  left_thigh: 'Left Thigh',
  right_thigh: 'Right Thigh',
  left_knee: 'Left Knee',
  right_knee: 'Right Knee',
  left_shin: 'Left Shin',
  right_shin: 'Right Shin',
  left_foot: 'Left Foot',
  right_foot: 'Right Foot',
  back_head: 'Back of Head',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  left_elbow: 'Left Elbow',
  right_elbow: 'Right Elbow',
  buttocks: 'Buttocks',
  left_hamstring: 'Left Hamstring',
  right_hamstring: 'Right Hamstring',
  left_calf: 'Left Calf',
  right_calf: 'Right Calf',
  left_ankle: 'Left Ankle',
  right_ankle: 'Right Ankle',
}

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
    case 'equipment_failure':
      return { label: 'Equipment Failure', color: 'bg-indigo-100 text-indigo-800' }
    case 'altercation':
      return { label: 'Altercation', color: 'bg-pink-100 text-pink-800' }
    case 'medical_emergency':
      return { label: 'Medical Emergency', color: 'bg-red-100 text-red-800' }
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

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'incidents', 'access')) {
    redirect('/dashboard')
  }

  const canViewAll = canUserAccess(user, 'incidents', 'viewAll')

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'INCIDENT',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  if (!submission) {
    notFound()
  }

  const data = submission.data as any
  const typeBadge = getTypeBadge(data?.incidentType || '')
  const severityBadge = getSeverityBadge(data?.severity || '')
  const statusBadge = getStatusBadge(submission.status)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/incidents" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Incident Report</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeBadge.color}`}>
              {typeBadge.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${severityBadge.color}`}>
              {severityBadge.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Reported on {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Alert for ambulance */}
      {data?.ambulanceCalled && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚑</span>
            <div>
              <h3 className="font-semibold text-red-800">Ambulance Was Called</h3>
              {data?.ambulanceDetails && (
                <p className="text-red-700 text-sm">{data.ambulanceDetails}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Date & Time</dt>
                <dd className="font-medium">
                  {data?.incidentDate || new Date(submission.submittedAt).toLocaleDateString()}
                  {data?.incidentTime && ` at ${data.incidentTime}`}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Location</dt>
                <dd className="font-medium">
                  {submission.rink.name}
                  {data?.location && ` - ${data.location}`}
                </dd>
              </div>
              {data?.equipmentInvolved && (
                <div>
                  <dt className="text-sm text-gray-500">Equipment Involved</dt>
                  <dd className="font-medium">{data.equipmentInvolved}</dd>
                </div>
              )}
              {data?.conditions && (
                <div>
                  <dt className="text-sm text-gray-500">Conditions</dt>
                  <dd className="font-medium">{data.conditions}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{data?.description || 'No description provided'}</p>
          </div>

          {/* Injury Details */}
          {(data?.incidentType === 'injury' || data?.incidentType === 'medical_emergency') && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Injury Details</h2>

              {data?.injuryLocations && data.injuryLocations.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Affected Body Parts</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.injuryLocations.map((part: string) => (
                      <span
                        key={part}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {BODY_PARTS_LABELS[part] || part}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data?.injuryDescription && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Injury Description</h3>
                  <p className="text-gray-700">{data.injuryDescription}</p>
                </div>
              )}

              {!data?.injuryLocations?.length && !data?.injuryDescription && (
                <p className="text-gray-400">No injury details provided</p>
              )}
            </div>
          )}

          {/* Witnesses */}
          {data?.witnesses && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Witnesses</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{data.witnesses}</p>
            </div>
          )}

          {/* Actions Taken */}
          {data?.actionsTaken && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions Taken</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{data.actionsTaken}</p>
            </div>
          )}

          {/* Additional Notes */}
          {data?.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Person Involved */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Person Involved</h2>
            {data?.involvedPersonName ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Name</dt>
                  <dd className="font-medium">{data.involvedPersonName}</dd>
                </div>
                {data?.involvedPersonType && (
                  <div>
                    <dt className="text-sm text-gray-500">Role</dt>
                    <dd className="font-medium capitalize">{data.involvedPersonType.replace('_', ' ')}</dd>
                  </div>
                )}
                {data?.involvedPersonPhone && (
                  <div>
                    <dt className="text-sm text-gray-500">Phone</dt>
                    <dd className="font-medium">
                      <a href={`tel:${data.involvedPersonPhone}`} className="text-blue-600 hover:underline">
                        {data.involvedPersonPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {data?.involvedPersonEmail && (
                  <div>
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="font-medium">
                      <a href={`mailto:${data.involvedPersonEmail}`} className="text-blue-600 hover:underline">
                        {data.involvedPersonEmail}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-400">No person information recorded</p>
            )}
          </div>

          {/* Notifications */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${data?.ambulanceCalled ? 'text-red-600' : 'text-gray-400'}`}>
                {data?.ambulanceCalled ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="text-sm">Ambulance Called</span>
              </div>
              <div className={`flex items-center gap-2 ${data?.policeNotified ? 'text-blue-600' : 'text-gray-400'}`}>
                {data?.policeNotified ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="text-sm">Police/Security Notified</span>
              </div>
              <div className={`flex items-center gap-2 ${data?.parentGuardianNotified ? 'text-green-600' : 'text-gray-400'}`}>
                {data?.parentGuardianNotified ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="text-sm">Parent/Guardian Notified</span>
              </div>
            </div>
          </div>

          {/* Report Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Reported By</dt>
                <dd className="font-medium">
                  {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Report ID</dt>
                <dd className="font-mono text-sm text-gray-600">{submission.id.slice(0, 8)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Submitted</dt>
                <dd className="text-sm text-gray-600">
                  {new Date(submission.submittedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
