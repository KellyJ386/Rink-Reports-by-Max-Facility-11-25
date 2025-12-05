export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
        </p>
        <div className="space-y-4">
          <div className="card p-4 text-left">
            <h3 className="font-medium text-gray-900 mb-2">What you can do offline:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• View previously loaded reports</li>
              <li>• Fill out forms (they'll sync when online)</li>
              <li>• Access cached schedules</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
