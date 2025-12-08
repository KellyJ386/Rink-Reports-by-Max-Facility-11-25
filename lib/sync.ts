// Sync Manager - Handles syncing offline submissions when back online

import {
  getPendingSubmissions,
  removeOfflineSubmission,
  incrementRetryCount,
  OfflineSubmission
} from './offline'

const MAX_RETRIES = 3
const SYNC_INTERVAL = 30000 // 30 seconds

type SyncStatus = 'idle' | 'syncing' | 'error'
type SyncListener = (status: SyncStatus, pendingCount: number) => void

let syncInterval: NodeJS.Timeout | null = null
let listeners: SyncListener[] = []
let currentStatus: SyncStatus = 'idle'

// Add listener for sync status changes
export function addSyncListener(listener: SyncListener): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

// Notify all listeners of status change
function notifyListeners(status: SyncStatus, pendingCount: number) {
  currentStatus = status
  listeners.forEach(listener => listener(status, pendingCount))
}

// Sync a single submission
async function syncSubmission(submission: OfflineSubmission): Promise<boolean> {
  try {
    const response = await fetch(submission.endpoint, {
      method: submission.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission.data),
    })

    if (response.ok) {
      await removeOfflineSubmission(submission.id)
      return true
    }

    // If server error (5xx), retry later
    if (response.status >= 500) {
      await incrementRetryCount(submission.id)
      return false
    }

    // If client error (4xx), remove and don't retry
    if (response.status >= 400 && response.status < 500) {
      console.error(`Submission ${submission.id} failed with ${response.status}, removing`)
      await removeOfflineSubmission(submission.id)
      return false
    }

    return false
  } catch (error) {
    console.error(`Failed to sync submission ${submission.id}:`, error)
    await incrementRetryCount(submission.id)
    return false
  }
}

// Sync all pending submissions
export async function syncAllPending(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 }
  }

  const pending = await getPendingSubmissions()

  if (pending.length === 0) {
    notifyListeners('idle', 0)
    return { synced: 0, failed: 0 }
  }

  notifyListeners('syncing', pending.length)

  let synced = 0
  let failed = 0

  for (const submission of pending) {
    // Skip if too many retries
    if (submission.retryCount >= MAX_RETRIES) {
      console.error(`Submission ${submission.id} exceeded max retries, skipping`)
      failed++
      continue
    }

    const success = await syncSubmission(submission)
    if (success) {
      synced++
    } else {
      failed++
    }
  }

  const remaining = await getPendingSubmissions()
  notifyListeners(failed > 0 ? 'error' : 'idle', remaining.length)

  return { synced, failed }
}

// Start automatic sync when online
export function startAutoSync() {
  if (typeof window === 'undefined') return

  // Sync immediately if online
  if (navigator.onLine) {
    syncAllPending()
  }

  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Back online, syncing pending submissions...')
    syncAllPending()
  })

  // Periodic sync check
  if (!syncInterval) {
    syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncAllPending()
      }
    }, SYNC_INTERVAL)
  }
}

// Stop automatic sync
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

// Get current sync status
export function getSyncStatus(): SyncStatus {
  return currentStatus
}

// Manual sync trigger
export async function triggerSync(): Promise<{ synced: number; failed: number }> {
  return syncAllPending()
}
