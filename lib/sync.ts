// Offline sync queue management

import {
  getPendingSubmissions,
  removeSubmission,
  incrementRetryCount,
  isOnline,
  onNetworkChange,
} from './offline'

const MAX_RETRIES = 3
const SYNC_INTERVAL = 30000 // 30 seconds

let syncInterval: NodeJS.Timeout | null = null
let isSyncing = false

// Start the sync service
export function startSyncService(): void {
  if (syncInterval) return

  // Initial sync
  syncPendingSubmissions()

  // Periodic sync
  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingSubmissions()
    }
  }, SYNC_INTERVAL)

  // Sync when coming back online
  onNetworkChange((online) => {
    if (online) {
      syncPendingSubmissions()
    }
  })

  // Register for background sync if available
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      // @ts-ignore - Background sync API
      registration.sync.register('sync-submissions').catch((err: Error) => {
        console.log('Background sync registration failed:', err)
      })
    })
  }
}

// Stop the sync service
export function stopSyncService(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

// Sync all pending submissions
export async function syncPendingSubmissions(): Promise<{
  synced: number
  failed: number
  remaining: number
}> {
  if (isSyncing || !isOnline()) {
    return { synced: 0, failed: 0, remaining: 0 }
  }

  isSyncing = true
  let synced = 0
  let failed = 0

  try {
    const pending = await getPendingSubmissions()

    for (const submission of pending) {
      try {
        const response = await fetch(submission.url, {
          method: submission.method,
          headers: submission.headers,
          body: JSON.stringify(submission.body),
        })

        if (response.ok) {
          await removeSubmission(submission.id!)
          synced++

          // Dispatch success event
          window.dispatchEvent(
            new CustomEvent('submission-synced', {
              detail: { id: submission.id, url: submission.url },
            })
          )
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - don't retry
          await removeSubmission(submission.id!)
          failed++

          window.dispatchEvent(
            new CustomEvent('submission-failed', {
              detail: {
                id: submission.id,
                url: submission.url,
                error: `Server returned ${response.status}`,
              },
            })
          )
        } else {
          // Server error - retry later
          await incrementRetryCount(submission.id!)
          if (submission.retryCount >= MAX_RETRIES) {
            await removeSubmission(submission.id!)
            failed++

            window.dispatchEvent(
              new CustomEvent('submission-failed', {
                detail: {
                  id: submission.id,
                  url: submission.url,
                  error: 'Max retries exceeded',
                },
              })
            )
          }
        }
      } catch (error) {
        // Network error - retry later
        await incrementRetryCount(submission.id!)
        if (submission.retryCount >= MAX_RETRIES) {
          await removeSubmission(submission.id!)
          failed++
        }
      }
    }

    const remainingItems = await getPendingSubmissions()
    return { synced, failed, remaining: remainingItems.length }
  } finally {
    isSyncing = false
  }
}

// Get sync status
export async function getSyncStatus(): Promise<{
  pendingCount: number
  isSyncing: boolean
  isOnline: boolean
}> {
  const pending = await getPendingSubmissions()
  return {
    pendingCount: pending.length,
    isSyncing,
    isOnline: isOnline(),
  }
}
