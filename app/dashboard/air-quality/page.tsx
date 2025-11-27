import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function AirQualityPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'airQuality', 'access')) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Air Quality</h1>
          <p className="text-gray-600 mt-1">CO/NO2 monitoring with compliance thresholds</p>
        </div>
        <button className="btn btn-primary">New Reading</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-2">CO Levels</h3>
          <p className="text-3xl font-bold text-green-600">-- ppm</p>
          <p className="text-sm text-gray-500">Warning: 20 ppm | Evacuation: 83 ppm</p>
        </div>
        <div className="card border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-2">NO2 Levels</h3>
          <p className="text-3xl font-bold text-green-600">-- ppm</p>
          <p className="text-sm text-gray-500">Warning: 0.3 ppm | Evacuation: 2.0 ppm</p>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌡️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Air Quality Module</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Monitor CO and NO2 levels with automatic alerts when thresholds are exceeded.
            Maintain compliance with air quality regulations.
          </p>
          <p className="text-sm text-blue-600 mt-4">Coming in Phase 5</p>
        </div>
      </div>
    </div>
  )
}
