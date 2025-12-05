import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { SubmissionsList } from '@/components/reports'

export default async function AirQualityPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  const canViewOwn = canUserAccess(user, 'airQuality', 'viewOwn')
  const canViewAll = canUserAccess(user, 'airQuality', 'viewAll')

  if (!canViewOwn && !canViewAll) {
    redirect('/dashboard')
  }

  // Get facility settings for threshold display
  const facilitySettings = await prisma.facilitySettings.findUnique({
    where: { facilityId: user.facilityId },
  })

  const thresholds = {
    coWarning: facilitySettings?.coWarningPpm ?? 20,
    coEvacuation: facilitySettings?.coEvacuationPpm ?? 83,
    no2Warning: facilitySettings?.no2WarningPpm ?? 0.3,
    no2Evacuation: facilitySettings?.no2EvacuationPpm ?? 2.0,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Air Quality Monitoring</h1>
        <p className="text-gray-600 mt-1">
          Track CO and NO2 levels to ensure safe air quality in your facility
        </p>
      </div>

      {/* Threshold Reference Card */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Threshold Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium">CO Warning</p>
            <p className="text-lg font-bold text-yellow-800">{thresholds.coWarning} ppm</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium">CO Evacuation</p>
            <p className="text-lg font-bold text-red-800">{thresholds.coEvacuation} ppm</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium">NO2 Warning</p>
            <p className="text-lg font-bold text-yellow-800">{thresholds.no2Warning} ppm</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium">NO2 Evacuation</p>
            <p className="text-lg font-bold text-red-800">{thresholds.no2Evacuation} ppm</p>
          </div>
        </div>
      </div>

      <SubmissionsList
        moduleType="AIR_QUALITY"
        baseUrl="/dashboard/air-quality"
        title="Air Quality Reports"
      />
    </div>
  )
}
