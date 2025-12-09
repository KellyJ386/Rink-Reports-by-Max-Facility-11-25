'use client'

import { useState, useEffect } from 'react'
import { isOnline, onNetworkChange } from '@/lib/offline'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Initial state
    setOnline(isOnline())

    // Listen for changes
    const unsubscribe = onNetworkChange((isOnline) => {
      setOnline(isOnline)
      if (!isOnline) {
        setShowBanner(true)
      }
    })

    return unsubscribe
  }, [])

  if (online && !showBanner) {
    return null
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        online ? 'bg-green-600' : 'bg-yellow-600'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            {online ? (
              <>
                <span className="mr-2">✓</span>
                Back online - syncing changes...
              </>
            ) : (
              <>
                <span className="mr-2">⚡</span>
                You're offline - changes will sync when reconnected
              </>
            )}
          </span>
        </div>
        {online && (
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/80 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
