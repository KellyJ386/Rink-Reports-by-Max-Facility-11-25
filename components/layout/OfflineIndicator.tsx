'use client'

import { useState, useEffect } from 'react'
import { getPendingCount, isOfflineSupported } from '@/lib/offline'
import { addSyncListener, triggerSync, startAutoSync } from '@/lib/sync'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !isOfflineSupported()) return

    // Initialize online status
    setIsOnline(navigator.onLine)

    // Start auto sync
    startAutoSync()

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      showNotification('Back online - syncing data...')
    }

    const handleOffline = () => {
      setIsOnline(false)
      showNotification('You are offline - data will sync when connected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for sync status
    const unsubscribe = addSyncListener((status, count) => {
      setIsSyncing(status === 'syncing')
      setPendingCount(count)

      if (status === 'idle' && count === 0) {
        // All synced
      } else if (status === 'error') {
        showNotification('Some submissions failed to sync')
      }
    })

    // Get initial pending count
    getPendingCount().then(setPendingCount)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  const showNotification = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    const result = await triggerSync()
    setIsSyncing(false)

    if (result.synced > 0) {
      showNotification(`Synced ${result.synced} submission${result.synced > 1 ? 's' : ''}`)
    }
  }

  // Don't render anything if online and no pending
  if (isOnline && pendingCount === 0 && !showToast) {
    return null
  }

  return (
    <>
      {/* Status Bar */}
      {(!isOnline || pendingCount > 0) && (
        <div
          className={`fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg ${
            isOnline ? 'bg-blue-600' : 'bg-gray-700'
          } text-white text-sm`}
        >
          {/* Status Icon */}
          {isOnline ? (
            <span className="flex items-center gap-2">
              {isSyncing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span>
                {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
              <span>Offline {pendingCount > 0 && `(${pendingCount} pending)`}</span>
            </span>
          )}

          {/* Manual Sync Button */}
          {isOnline && pendingCount > 0 && !isSyncing && (
            <button
              onClick={handleManualSync}
              className="ml-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium"
            >
              Sync Now
            </button>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toastMessage}
        </div>
      )}
    </>
  )
}
