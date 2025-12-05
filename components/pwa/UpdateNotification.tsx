'use client'

import { useState, useEffect } from 'react'

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    const handleUpdate = () => setShowUpdate(true)
    window.addEventListener('sw-update-available', handleUpdate)
    return () => window.removeEventListener('sw-update-available', handleUpdate)
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-xl shadow-xl p-4 z-50">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🔄</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Update Available</h3>
          <p className="text-sm text-blue-100 mt-1">
            A new version of MFO is available
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleUpdate}
              className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-400"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
