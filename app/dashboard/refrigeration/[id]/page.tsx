import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const RANGES = {
  suctionPressure: { min: 20, max: 40, unit: 'PSI', label: 'Suction Pressure' },
  dischargePressure: { min: 150, max: 250, unit: 'PSI', label: 'Discharge Pressure' },
  brineTemp: { min: 18, max: 24, unit: '°F', label: 'Brine Temperature' },
  compressorAmps: { min: 50, max: 150, unit: 'A', label: 'Compressor Amps' },
}

function getStatusBadge(value: number | null, min: number, max: number) {
  if (value === null || value === undefined) return null
  if (value < min * 0.9 || value > max * 1.1) {
    return { label: 'Critical', color: 'bg-red-100 text-red-800' }
  }
  if (value < min || value > max) {
    return { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' }
  }
  return { label: 'Normal', color: 'bg-green-100 text-green-800' }
}

export default async function RefrigerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'refrigeration', 'access')) {
    redirect('/dashboard')
  }

  const canViewAll = canUserAccess(user, 'refrigeration', 'viewAll')

  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'REFRIGERATION',
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

  // Check for any alerts
  const hasAlerts =
    (data?.suctionPressure && (data.suctionPressure < RANGES.suctionPressure.min || data.suctionPressure > RANGES.suctionPressure.max)) ||
    (data?.dischargePressure && (data.dischargePressure < RANGES.dischargePressure.min || data.dischargePressure > RANGES.dischargePressure.max)) ||
    (data?.brineTemp && (data.brineTemp < RANGES.brineTemp.min || data.brineTemp > RANGES.brineTemp.max)) ||
    data?.leaksDetected ||
    data?.abnormalNoise ||
    data?.abnormalVibration

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/refrigeration" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Refrigeration Reading</h1>
            {hasAlerts ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Alert</span>
            ) : (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Normal</span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {submission.rink.name} - {new Date(submission.submittedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {data?.leaksDetected && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="font-semibold text-red-800">Refrigerant Leak Detected</h3>
              {data?.leakLocation && (
                <p className="text-red-700 text-sm">Location: {data.leakLocation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compressor Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compressor Status</h2>
            <div className="flex gap-4 mb-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${data?.compressor1Running ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className={`w-3 h-3 rounded-full ${data?.compressor1Running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Compressor #1 {data?.compressor1Running ? 'Running' : 'Off'}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${data?.compressor2Running ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className={`w-3 h-3 rounded-full ${data?.compressor2Running ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">Compressor #2 {data?.compressor2Running ? 'Running' : 'Off'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{data?.suctionPressure ?? '--'}</div>
                <div className="text-xs text-gray-500 mb-1">Suction PSI</div>
                {data?.suctionPressure && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(data.suctionPressure, RANGES.suctionPressure.min, RANGES.suctionPressure.max)?.color}`}>
                    {getStatusBadge(data.suctionPressure, RANGES.suctionPressure.min, RANGES.suctionPressure.max)?.label}
                  </span>
                )}
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{data?.dischargePressure ?? '--'}</div>
                <div className="text-xs text-gray-500 mb-1">Discharge PSI</div>
                {data?.dischargePressure && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(data.dischargePressure, RANGES.dischargePressure.min, RANGES.dischargePressure.max)?.color}`}>
                    {getStatusBadge(data.dischargePressure, RANGES.dischargePressure.min, RANGES.dischargePressure.max)?.label}
                  </span>
                )}
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{data?.oilPressure ?? '--'}</div>
                <div className="text-xs text-gray-500">Oil PSI</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{data?.compressorAmps ?? '--'}</div>
                <div className="text-xs text-gray-500">Amps</div>
              </div>
            </div>
            {data?.oilLevel && data.oilLevel !== 'normal' && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-yellow-800">Oil Level: <strong className="capitalize">{data.oilLevel}</strong></span>
              </div>
            )}
          </div>

          {/* Temperatures */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temperatures</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{data?.brineTemp ?? '--'}</div>
                <div className="text-xs text-blue-600 mb-1">Brine Supply °F</div>
                {data?.brineTemp && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(data.brineTemp, RANGES.brineTemp.min, RANGES.brineTemp.max)?.color}`}>
                    {getStatusBadge(data.brineTemp, RANGES.brineTemp.min, RANGES.brineTemp.max)?.label}
                  </span>
                )}
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{data?.brineReturnTemp ?? '--'}</div>
                <div className="text-xs text-blue-600">Brine Return °F</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{data?.condenserTemp ?? '--'}</div>
                <div className="text-xs text-blue-600">Condenser °F</div>
              </div>
              {(data?.condenserWaterIn || data?.condenserWaterOut) && (
                <>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold">{data?.condenserWaterIn ?? '--'}</div>
                    <div className="text-xs text-gray-500">Water In °F</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold">{data?.condenserWaterOut ?? '--'}</div>
                    <div className="text-xs text-gray-500">Water Out °F</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* System Checks */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Checks</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Refrigerant Level</span>
                <div className={`font-medium capitalize ${data?.refrigerantLevel === 'low' ? 'text-red-600' : data?.refrigerantLevel === 'high' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {data?.refrigerantLevel || 'Not recorded'}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Sight Glass</span>
                <div className={`font-medium capitalize ${data?.sightGlass === 'clear' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {data?.sightGlass || 'Not recorded'}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className={`flex items-center gap-2 ${data?.abnormalNoise ? 'text-yellow-600' : 'text-gray-400'}`}>
                {data?.abnormalNoise ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm">{data?.abnormalNoise ? 'Abnormal Noise Detected' : 'No Abnormal Noise'}</span>
              </div>
              <div className={`flex items-center gap-2 ${data?.abnormalVibration ? 'text-yellow-600' : 'text-gray-400'}`}>
                {data?.abnormalVibration ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm">{data?.abnormalVibration ? 'Abnormal Vibration Detected' : 'No Abnormal Vibration'}</span>
              </div>
              <div className={`flex items-center gap-2 ${data?.leaksDetected ? 'text-red-600' : 'text-gray-400'}`}>
                {data?.leaksDetected ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm">{data?.leaksDetected ? 'Leak Detected' : 'No Leaks Detected'}</span>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          {(data?.maintenanceRequired || data?.maintenanceNotes) && (
            <div className="card border-l-4 border-yellow-500">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Required</h2>
              <p className="text-gray-700">{data?.maintenanceNotes || 'Maintenance flagged - no details provided'}</p>
            </div>
          )}

          {/* Notes */}
          {data?.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Location</dt>
                <dd className="font-medium">{submission.rink.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Recorded By</dt>
                <dd className="font-medium">
                  {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Date & Time</dt>
                <dd className="text-sm text-gray-600">
                  {new Date(submission.submittedAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Report ID</dt>
                <dd className="font-mono text-sm text-gray-600">{submission.id.slice(0, 8)}</dd>
              </div>
            </dl>
          </div>

          {/* Normal Ranges Reference */}
          <div className="card bg-blue-50">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Normal Ranges</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-blue-700">Suction PSI</dt>
                <dd className="font-medium text-blue-900">{RANGES.suctionPressure.min}-{RANGES.suctionPressure.max}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-700">Discharge PSI</dt>
                <dd className="font-medium text-blue-900">{RANGES.dischargePressure.min}-{RANGES.dischargePressure.max}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-700">Brine Temp</dt>
                <dd className="font-medium text-blue-900">{RANGES.brineTemp.min}-{RANGES.brineTemp.max}°F</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-blue-700">Comp. Amps</dt>
                <dd className="font-medium text-blue-900">{RANGES.compressorAmps.min}-{RANGES.compressorAmps.max}A</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
