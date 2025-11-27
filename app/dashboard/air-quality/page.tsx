import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getCoStatus(ppm: number, warning: number, evacuation: number) {
  if (ppm >= evacuation) return { label: 'EVACUATE', color: 'bg-red-600 text-white', urgent: true }
  if (ppm >= warning) return { label: 'Warning', color: 'bg-yellow-500 text-white', urgent: true }
  return { label: 'Normal', color: 'bg-green-500 text-white', urgent: false }
}

function getNo2Status(ppm: number, warning: number, evacuation: number) {
  if (ppm >= evacuation) return { label: 'EVACUATE', color: 'bg-red-600 text-white', urgent: true }
  if (ppm >= warning) return { label: 'Warning', color: 'bg-yellow-500 text-white', urgent: true }
  return { label: 'Normal', color: 'bg-green-500 text-white', urgent: false }
}

export default async function AirQualityPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'airQuality', 'access')) {
    redirect('/dashboard')
  }

  const canSubmit = canUserAccess(user, 'airQuality', 'submit')
  const canViewAll = canUserAccess(user, 'airQuality', 'viewAll')

  // Get facility settings for thresholds
  const settings = await prisma.facilitySettings.findUnique({
    where: { facilityId: user.facilityId },
  })

  const thresholds = {
    coWarning: settings?.coWarningPpm || 20,
    coEvacuation: settings?.coEvacuationPpm || 83,
    no2Warning: settings?.no2WarningPpm || 0.3,
    no2Evacuation: settings?.no2EvacuationPpm || 2.0,
  }

  const rinks = await prisma.rink.findMany({
    where: { facility: { id: user.facilityId }, isActive: true },
    orderBy: { name: 'asc' },
  })

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'AIR_QUALITY',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 50,
  })

  // Find latest reading per rink
  const latestByRink: Record<string, any> = {}
  submissions.forEach((s) => {
    if (!latestByRink[s.rinkId]) {
      latestByRink[s.rinkId] = s
    }
  })

  // Check for any alerts
  const alerts = submissions.slice(0, 10).filter((s) => {
    const data = s.data as any
    return (data?.coPpm >= thresholds.coWarning) || (data?.no2Ppm >= thresholds.no2Warning)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Air Quality</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor CO and NO2 levels for safety compliance</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/air-quality/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Reading
          </Link>
        )}
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">Air Quality Alert</h3>
              <p className="text-red-700 text-sm">
                {alerts.length} recent reading{alerts.length > 1 ? 's' : ''} exceeded safety thresholds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Levels by Rink */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Levels</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rinks.map((rink) => {
            const latest = latestByRink[rink.id]
            const data = latest?.data as any
            const coStatus = data?.coPpm !== undefined ? getCoStatus(data.coPpm, thresholds.coWarning, thresholds.coEvacuation) : null
            const no2Status = data?.no2Ppm !== undefined ? getNo2Status(data.no2Ppm, thresholds.no2Warning, thresholds.no2Evacuation) : null

            return (
              <div key={rink.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{rink.name}</h3>
                  {latest && (
                    <span className="text-xs text-gray-500">
                      {new Date(latest.submittedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {latest ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{data?.coPpm ?? '--'}</div>
                      <div className="text-xs text-gray-500 mb-1">CO (ppm)</div>
                      {coStatus && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${coStatus.color}`}>
                          {coStatus.label}
                        </span>
                      )}
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{data?.no2Ppm ?? '--'}</div>
                      <div className="text-xs text-gray-500 mb-1">NO2 (ppm)</div>
                      {no2Status && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${no2Status.color}`}>
                          {no2Status.label}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">No readings yet</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Thresholds Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Safety Thresholds</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Carbon Monoxide (CO)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Warning Level</span>
                <span className="font-medium text-yellow-600">{thresholds.coWarning} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Evacuation Level</span>
                <span className="font-medium text-red-600">{thresholds.coEvacuation} ppm</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Nitrogen Dioxide (NO2)</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Warning Level</span>
                <span className="font-medium text-yellow-600">{thresholds.no2Warning} ppm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Evacuation Level</span>
                <span className="font-medium text-red-600">{thresholds.no2Evacuation} ppm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Readings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Readings</h2>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No readings recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date/Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rink</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">CO (ppm)</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">NO2 (ppm)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 20).map((s) => {
                  const data = s.data as any
                  const coStatus = data?.coPpm !== undefined ? getCoStatus(data.coPpm, thresholds.coWarning, thresholds.coEvacuation) : null
                  const no2Status = data?.no2Ppm !== undefined ? getNo2Status(data.no2Ppm, thresholds.no2Warning, thresholds.no2Evacuation) : null
                  const hasAlert = coStatus?.urgent || no2Status?.urgent

                  return (
                    <tr key={s.id} className={`border-b border-gray-100 ${hasAlert ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{new Date(s.submittedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{s.rink.name}</td>
                      <td className="py-3 px-4 text-right font-mono">{data?.coPpm ?? '--'}</td>
                      <td className="py-3 px-4 text-right font-mono">{data?.no2Ppm ?? '--'}</td>
                      <td className="py-3 px-4">
                        {hasAlert ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Alert</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/air-quality/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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
