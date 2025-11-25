export default function AirQualityPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">Air Quality</h1>
        <p className="text-gray-600 mt-2">
          Monitor CO and NO2 levels with compliance thresholds
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🌡️</div>
          <h2 className="text-xl font-semibold text-navy mb-2">Air Quality Module</h2>
          <p>Track carbon monoxide and nitrogen dioxide with automatic alerts</p>
          <p className="text-sm mt-4 text-gray-400">Coming in Phase 5</p>
        </div>
      </div>
    </div>
  )
}
