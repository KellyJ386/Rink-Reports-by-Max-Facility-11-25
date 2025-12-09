'use client'

import { useEffect, useState } from 'react'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineAlert(false)
      console.log('[App] Back online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineAlert(true)
      console.log('[App] Gone offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline && !showOfflineAlert) {
      const timer = setTimeout(() => {
        setShowOfflineAlert(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showOfflineAlert])

  if (isOnline && !showOfflineAlert) {
    return null
  }

  const statusClass = isOnline
    ? 'bg-green-500 text-white'
    : 'bg-yellow-500 text-gray-900'

  return (
    <div
      className={'fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-3 text-sm font-medium transition-all ' + statusClass}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Back online - Changes will sync automatically</span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>You are offline - Changes will be saved locally</span>
          </>
        )}
      </div>
    </div>
  )
}
