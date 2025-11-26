import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PageHeader, StatusBadge } from '@/components/shared'
import { UniversalHeaderView } from '@/components/forms'
import ThresholdAlert from '@/components/air-quality/ThresholdAlert'

interface PageProps {
  params: Promise<{ id: string }>
}

const CO_WARNING = 20
const CO_EVAC = 83
const NO2_WARNING = 0.3
const NO2_EVAC = 2.0

export default async function AirQualityDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'AIR_QUALITY',
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

  const locationLabels: Record<string, string> = {
    rink_level: 'Rink Level (Ice Surface)',
    spectator: 'Spectator Area',
    zamboni_room: 'Zamboni Room',
    locker_room: 'Locker Room',
    other: 'Other',
  }

  const equipmentLabels: Record<string, string> = {
    portable_detector: 'Portable Gas Detector',
    fixed_monitor: 'Fixed Monitor System',
    test_tubes: 'Colorimetric Test Tubes',
  }

  const ventilationLabels: Record<string, string> = {
    normal: 'Normal Operation',
    increased: 'Increased Ventilation',
    doors_open: 'Doors Open for Ventilation',
    malfunction: 'System Malfunction',
  }

  return (
    <div>
      <PageHeader
        title="Air Quality Reading"
        backHref="/dashboard/air-quality"
        backLabel="Back to Air Quality"
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

        {/* Measurement Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Measurement Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-medium">{locationLabels[data.measurementLocation] || data.measurementLocation}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Equipment Used</p>
              <p className="font-medium">{equipmentLabels[data.equipmentUsed] || data.equipmentUsed}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Ventilation Status</p>
              <p className="font-medium">{ventilationLabels[data.ventilationStatus] || data.ventilationStatus}</p>
            </div>
          </div>
        </div>

        {/* Gas Level Readings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Gas Level Readings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThresholdAlert
              type="CO"
              value={data.coLevel || 0}
              unit="ppm"
              warningThreshold={CO_WARNING}
              evacuationThreshold={CO_EVAC}
            />
            <ThresholdAlert
              type="NO2"
              value={data.no2Level || 0}
              unit="ppm"
              warningThreshold={NO2_WARNING}
              evacuationThreshold={NO2_EVAC}
            />
          </div>
        </div>

        {/* Actions Taken */}
        {data.actionsTaken && (
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Actions Taken</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">{data.actionsTaken}</p>
            </div>
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
        </div>
      </div>
    </div>
  )
}
