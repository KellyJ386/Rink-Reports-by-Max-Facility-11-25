export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">M</span>
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading MFO...</p>
      </div>
    </div>
  )
}
