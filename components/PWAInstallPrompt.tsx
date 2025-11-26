'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      const installDismissed = localStorage.getItem('pwa-install-dismissed')
      if (!installDismissed) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully')
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()

    const choiceResult = await deferredPrompt.userChoice
    
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt')
    } else {
      console.log('[PWA] User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium">Install MFO Rinks</p>
              <p className="text-xs opacity-90">
                Install our app for quick access and offline support
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
