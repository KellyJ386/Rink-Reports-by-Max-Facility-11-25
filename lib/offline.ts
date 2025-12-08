// Offline Storage using IndexedDB
// Stores form submissions when offline and syncs when back online

const DB_NAME = 'RinkReportsOffline'
const DB_VERSION = 1
const STORE_NAME = 'pendingSubmissions'

export interface OfflineSubmission {
  id: string
  moduleType: string
  endpoint: string
  method: 'POST' | 'PUT'
  data: Record<string, unknown>
  createdAt: string
  retryCount: number
}

let db: IDBDatabase | null = null

// Initialize IndexedDB
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open offline database'))
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('moduleType', 'moduleType', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

// Save submission for offline sync
export async function saveOfflineSubmission(submission: Omit<OfflineSubmission, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
  const database = await initOfflineDB()

  const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const record: OfflineSubmission = {
    ...submission,
    id,
    createdAt: new Date().toISOString(),
    retryCount: 0
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(record)

    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(new Error('Failed to save offline submission'))
  })
}

// Get all pending submissions
export async function getPendingSubmissions(): Promise<OfflineSubmission[]> {
  const database = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error('Failed to get pending submissions'))
  })
}

// Get count of pending submissions
export async function getPendingCount(): Promise<number> {
  const database = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Failed to count pending submissions'))
  })
}

// Remove a submission after successful sync
export async function removeOfflineSubmission(id: string): Promise<void> {
  const database = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to remove offline submission'))
  })
}

// Update retry count for failed sync
export async function incrementRetryCount(id: string): Promise<void> {
  const database = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const record = getRequest.result as OfflineSubmission
      if (record) {
        record.retryCount += 1
        store.put(record)
      }
      resolve()
    }
    getRequest.onerror = () => reject(new Error('Failed to update retry count'))
  })
}

// Clear all pending submissions
export async function clearAllPending(): Promise<void> {
  const database = await initOfflineDB()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to clear pending submissions'))
  })
}

// Check if browser supports IndexedDB
export function isOfflineSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

// Check if currently online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
