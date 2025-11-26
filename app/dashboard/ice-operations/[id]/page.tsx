import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PageHeader, StatusBadge } from '@/components/shared'
import { UniversalHeaderView } from '@/components/forms'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IceOperationsDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'ICE_OPERATIONS',
      },
    },
    include: {
      rink: true,
      submittedBy: {
        select: { firstName: true, lastName: true, email: true },
      },
      formTemplate: {
        select: { name: true },
      },
    },
  })

  if (!submission) notFound()

  const data = submission.data as any

  const operationTypeLabels: Record<string, string> = {
    ice_make: 'Ice Make / Flood',
    circle_check: 'Circle Check',
    edging: 'Edging',
    blade_change: 'Blade Change',
  }

  const renderOperationDetails = () => {
    switch (data.operationType) {
      case 'ice_make':
        return (
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Water Temperature</p>
              <p className="font-medium">{data.waterTemp ? `${data.waterTemp}°F` : 'Not recorded'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Number of Floods</p>
              <p className="font-medium">{data.floodCount || 'Not recorded'}</p>
            </div>
          </div>
        )

      case 'circle_check':
        return (
          <div className="p-4 bg-yellow-50 rounded-lg space-y-3">
            <div>
              <p className="text-xs text-gray-500">Issues Found</p>
              <p className="font-medium">{data.issuesFound ? 'Yes' : 'No'}</p>
            </div>
            {data.issuesFound && data.issueNotes && (
              <div>
                <p className="text-xs text-gray-500">Issue Description</p>
                <p className="font-medium">{data.issueNotes}</p>
              </div>
            )}
          </div>
        )

      case 'edging':
        return (
          <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Edge Type</p>
              <p className="font-medium capitalize">{data.edgeType?.replace('_', ' ') || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Boards Edged</p>
              <p className="font-medium">{data.boardsEdged ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )

      case 'blade_change':
        return (
          <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">New Blade Number</p>
              <p className="font-medium">{data.bladeNumber || 'Not recorded'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reason for Change</p>
              <p className="font-medium capitalize">{data.reasonForChange?.replace('_', ' ') || 'Not specified'}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div>
      <PageHeader
        title="Ice Operations Report"
        backHref="/dashboard/ice-operations"
        backLabel="Back to Ice Operations"
        actions={
          <StatusBadge status={submission.status} size="md" />
        }
      />

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Universal Header Info */}
        <UniversalHeaderView
          rinkName={submission.rink.name}
          submittedAt={submission.submittedAt}
          outsideTemp={submission.outsideTemp ?? undefined}
          outsideTempUnit={submission.outsideTempUnit}
          submittedBy={`${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`}
        />

        {/* Operation Type */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">
            {operationTypeLabels[data.operationType] || 'Operation Details'}
          </h3>
          {renderOperationDetails()}
        </div>

        {/* Time Completed */}
        {data.completedAt && (
          <div className="border-t pt-6">
            <p className="text-xs text-gray-500">Time Completed</p>
            <p className="font-medium">{data.completedAt}</p>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="border-t pt-6">
            <p className="text-xs text-gray-500 mb-1">Additional Notes</p>
            <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6 text-xs text-gray-400">
          <p>Submission ID: {submission.id}</p>
          <p>Form Version: {submission.formVersionAtSubmission}</p>
        </div>
      </div>
    </div>
  )
}
