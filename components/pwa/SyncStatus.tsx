'use client'

import { useState, useEffect } from 'react'
import { getSyncStatus, syncPendingSubmissions } from '@/lib/sync'

export function SyncStatus() {
  const [status, setStatus] = useState({
    pendingCount: 0,
    isSyncing: false,
    isOnline: true,
  })
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    updateStatus()
    const interval = setInterval(updateStatus, 5000)

    // Listen for sync events
    const handleSynced = () => updateStatus()
    const handleFailed = () => updateStatus()

    window.addEventListener('submission-synced', handleSynced)
    window.addEventListener('submission-failed', handleFailed)

    return () => {
      clearInterval(interval)
      window.removeEventListener('submission-synced', handleSynced)
      window.removeEventListener('submission-failed', handleFailed)
    }
  }, [])

  const updateStatus = async () => {
    const newStatus = await getSyncStatus()
    setStatus(newStatus)
  }

  const handleManualSync = async () => {
    if (!status.isOnline || status.isSyncing) return
    await syncPendingSubmissions()
    updateStatus()
  }

  if (status.pendingCount === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium"
      >
        <span className={status.isSyncing ? 'animate-spin' : ''}>
          {status.isSyncing ? '🔄' : '📤'}
        </span>
        <span>{status.pendingCount} pending</span>
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border p-4 z-50">
          <h4 className="font-medium text-gray-900 mb-2">Sync Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending items:</span>
              <span className="font-medium">{status.pendingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={status.isOnline ? 'text-green-600' : 'text-yellow-600'}>
                {status.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Syncing:</span>
              <span>{status.isSyncing ? 'Yes' : 'No'}</span>
            </div>
          </div>
          {status.isOnline && !status.isSyncing && status.pendingCount > 0 && (
            <button
              onClick={handleManualSync}
              className="mt-3 w-full btn btn-primary text-sm"
            >
              Sync Now
            </button>
          )}
        </div>
      )}
    </div>
  )
}
