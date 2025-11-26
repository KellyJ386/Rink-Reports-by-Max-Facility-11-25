import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PageHeader, StatusBadge } from '@/components/shared'
import { UniversalHeaderView } from '@/components/forms'
import IceDepthGridView from './IceDepthGridView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IceDepthDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'ICE_DEPTH',
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
  const measurements = data.measurements || []
  const values = measurements.filter((m: any) => m.value != null).map((m: any) => m.value)
  const avgDepth = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0
  const minDepth = values.length > 0 ? Math.min(...values) : 0
  const maxDepth = values.length > 0 ? Math.max(...values) : 0

  return (
    <div>
      <PageHeader
        title="Ice Depth Measurement"
        backHref="/dashboard/ice-depth"
        backLabel="Back to Ice Depth"
        actions={<StatusBadge status={submission.status} size="md" />}
      />

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <UniversalHeaderView
          rinkName={submission.rink.name}
          submittedAt={submission.submittedAt}
          outsideTemp={submission.outsideTemp ?? undefined}
          outsideTempUnit={submission.outsideTempUnit}
          submittedBy={`${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`}
        />

        {/* Statistics */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Measurement Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Points Measured</p>
              <p className="text-2xl font-bold">{values.length}/{measurements.length}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500">Average Depth</p>
              <p className="text-2xl font-bold text-blue-600">{avgDepth.toFixed(2)}"</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-500">Minimum Depth</p>
              <p className="text-2xl font-bold text-red-600">{minDepth.toFixed(2)}"</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500">Maximum Depth</p>
              <p className="text-2xl font-bold text-green-600">{maxDepth.toFixed(2)}"</p>
            </div>
          </div>
        </div>

        {/* Grid Visualization */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Measurement Grid</h3>
          <IceDepthGridView measurements={measurements} />
        </div>

        {/* Problem Areas */}
        {values.some((v: number) => v < 0.75) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">⚠️ Thin Ice Warning</h4>
            <p className="text-sm text-red-700">
              Some measurement points show ice thickness below 0.75 inches. Consider additional flooding.
            </p>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {measurements
                .filter((m: any) => m.value != null && m.value < 0.75)
                .map((m: any) => (
                  <li key={m.id}>{m.label}: {m.value.toFixed(2)}"</li>
                ))}
            </ul>
          </div>
        )}

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
          <p>Preset: {data.preset} points</p>
        </div>
      </div>
    </div>
  )
}
