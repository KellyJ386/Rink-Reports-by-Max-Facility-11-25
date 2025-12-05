'use client'

import { useEffect } from 'react'
import { startSyncService } from '@/lib/sync'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
      startSyncService()
    }
  }, [])

  return null
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service Worker registered:', registration.scope)

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showUpdateNotification()
          }
        })
      }
    })
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

function showUpdateNotification() {
  // Dispatch event for UI to handle
  window.dispatchEvent(new CustomEvent('sw-update-available'))
}
