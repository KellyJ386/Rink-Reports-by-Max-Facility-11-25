// Offline storage utilities using IndexedDB

const DB_NAME = 'mfo-offline'
const DB_VERSION = 1

interface PendingSubmission {
  id?: number
  url: string
  method: string
  headers: Record<string, string>
  body: Record<string, unknown>
  timestamp: number
  retryCount: number
}

interface CachedData {
  key: string
  data: unknown
  timestamp: number
  expiresAt: number
}

// Open IndexedDB connection
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Pending submissions store
      if (!db.objectStoreNames.contains('pendingSubmissions')) {
        const store = db.createObjectStore('pendingSubmissions', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Cached data store
      if (!db.objectStoreNames.contains('cachedData')) {
        const store = db.createObjectStore('cachedData', { keyPath: 'key' })
        store.createIndex('expiresAt', 'expiresAt', { unique: false })
      }

      // Draft submissions store
      if (!db.objectStoreNames.contains('draftSubmissions')) {
        const store = db.createObjectStore('draftSubmissions', { keyPath: 'id' })
        store.createIndex('moduleType', 'moduleType', { unique: false })
      }
    }
  })
}

// Add a submission to the offline queue
export async function queueSubmission(
  url: string,
  method: string,
  body: Record<string, unknown>
): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSubmissions', 'readwrite')
    const store = tx.objectStore('pendingSubmissions')

    const submission: PendingSubmission = {
      url,
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
      timestamp: Date.now(),
      retryCount: 0,
    }

    const request = store.add(submission)
    request.onsuccess = () => resolve(request.result as number)
    request.onerror = () => reject(request.error)
  })
}

// Get all pending submissions
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSubmissions', 'readonly')
    const store = tx.objectStore('pendingSubmissions')
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Remove a submission from the queue
export async function removeSubmission(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSubmissions', 'readwrite')
    const store = tx.objectStore('pendingSubmissions')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Update retry count for a submission
export async function incrementRetryCount(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendingSubmissions', 'readwrite')
    const store = tx.objectStore('pendingSubmissions')
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const submission = getRequest.result as PendingSubmission
      if (submission) {
        submission.retryCount++
        store.put(submission)
      }
      resolve()
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Cache data with expiration
export async function cacheData(
  key: string,
  data: unknown,
  ttlMinutes: number = 60
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedData', 'readwrite')
    const store = tx.objectStore('cachedData')

    const cached: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    }

    const request = store.put(cached)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get cached data
export async function getCachedData<T>(key: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedData', 'readonly')
    const store = tx.objectStore('cachedData')
    const request = store.get(key)

    request.onsuccess = () => {
      const cached = request.result as CachedData | undefined
      if (!cached) {
        resolve(null)
        return
      }

      // Check expiration
      if (cached.expiresAt < Date.now()) {
        // Data expired, delete it
        const deleteTx = db.transaction('cachedData', 'readwrite')
        deleteTx.objectStore('cachedData').delete(key)
        resolve(null)
        return
      }

      resolve(cached.data as T)
    }
    request.onerror = () => reject(request.error)
  })
}

// Clear expired cache entries
export async function clearExpiredCache(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cachedData', 'readwrite')
    const store = tx.objectStore('cachedData')
    const index = store.index('expiresAt')
    const now = Date.now()

    let deletedCount = 0
    const request = index.openCursor(IDBKeyRange.upperBound(now))

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null
      if (cursor) {
        cursor.delete()
        deletedCount++
        cursor.continue()
      } else {
        resolve(deletedCount)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// Save draft submission locally
export async function saveDraft(
  id: string,
  moduleType: string,
  formData: Record<string, unknown>
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('draftSubmissions', 'readwrite')
    const store = tx.objectStore('draftSubmissions')

    const request = store.put({
      id,
      moduleType,
      formData,
      savedAt: Date.now(),
    })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get draft submission
export async function getDraft(id: string): Promise<Record<string, unknown> | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('draftSubmissions', 'readonly')
    const store = tx.objectStore('draftSubmissions')
    const request = store.get(id)

    request.onsuccess = () => {
      resolve(request.result?.formData || null)
    }
    request.onerror = () => reject(request.error)
  })
}

// Delete draft submission
export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('draftSubmissions', 'readwrite')
    const store = tx.objectStore('draftSubmissions')
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get all drafts for a module type
export async function getDraftsByModule(moduleType: string): Promise<Array<{ id: string; formData: Record<string, unknown>; savedAt: number }>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('draftSubmissions', 'readonly')
    const store = tx.objectStore('draftSubmissions')
    const index = store.index('moduleType')
    const request = index.getAll(moduleType)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine
}

// Listen for online/offline events
export function onNetworkChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
