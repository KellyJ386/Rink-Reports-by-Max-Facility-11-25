import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { PageHeader, StatusBadge } from '@/components/shared'
import { UniversalHeaderView } from '@/components/forms'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RefrigerationDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: session.user.facilityId,
        moduleType: 'REFRIGERATION',
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

  const ReadingCard = ({ label, value, unit, warning }: { label: string; value?: number; unit?: string; warning?: boolean }) => (
    <div className={`p-3 rounded-lg ${warning ? 'bg-red-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-semibold ${warning ? 'text-red-600' : ''}`}>
        {value !== undefined && value !== null ? `${value}${unit || ''}` : '—'}
      </p>
    </div>
  )

  const StatusIndicator = ({ label, status }: { label: string; status: string }) => {
    const colors: Record<string, string> = {
      running: 'bg-green-100 text-green-800',
      normal: 'bg-green-100 text-green-800',
      off: 'bg-gray-100 text-gray-800',
      fault: 'bg-red-100 text-red-800',
      low: 'bg-yellow-100 text-yellow-800',
      high: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    }

    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">{label}</p>
        <span className={`inline-block mt-1 px-2 py-1 text-sm font-medium rounded ${colors[status] || 'bg-gray-100'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Refrigeration Reading"
        backHref="/dashboard/refrigeration"
        backLabel="Back to Refrigeration"
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

        {/* Compressor Readings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Compressor Readings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusIndicator label="Compressor Status" status={data.compressorStatus || 'off'} />
            <ReadingCard label="Suction Pressure" value={data.suctionPressure} unit=" PSI" />
            <ReadingCard label="Discharge Pressure" value={data.dischargePressure} unit=" PSI" />
            <ReadingCard label="Oil Pressure" value={data.oilPressure} unit=" PSI" />
          </div>
        </div>

        {/* Temperature Readings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Temperature Readings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReadingCard label="Brine Supply" value={data.brineSupplyTemp} unit="°F" />
            <ReadingCard label="Brine Return" value={data.brineReturnTemp} unit="°F" />
            <ReadingCard label="Condenser In" value={data.condenserInTemp} unit="°F" />
            <ReadingCard label="Condenser Out" value={data.condenserOutTemp} unit="°F" />
          </div>
        </div>

        {/* Brine System */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Brine System</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatusIndicator label="Brine Level" status={data.brineLevel || 'normal'} />
            <StatusIndicator label="Brine Pump" status={data.brinePumpStatus || 'off'} />
          </div>
        </div>

        {/* Alarms */}
        {data.alarmsPresent && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Active Alarms</h3>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-800">{data.alarmNotes || 'Alarms present - no details provided'}</p>
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
