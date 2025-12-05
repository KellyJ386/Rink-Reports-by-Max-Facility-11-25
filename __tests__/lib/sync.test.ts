import {
  startSyncService,
  stopSyncService,
  syncPendingSubmissions,
  getSyncStatus,
} from '@/lib/sync'
import * as offline from '@/lib/offline'

// Mock the offline module
jest.mock('@/lib/offline', () => ({
  getPendingSubmissions: jest.fn(),
  removeSubmission: jest.fn(),
  incrementRetryCount: jest.fn(),
  isOnline: jest.fn(),
  onNetworkChange: jest.fn(),
}))

describe('sync', () => {
  const mockOffline = offline as jest.Mocked<typeof offline>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockOffline.isOnline.mockReturnValue(true)
    mockOffline.getPendingSubmissions.mockResolvedValue([])
    mockOffline.onNetworkChange.mockReturnValue(() => {})

    // Mock fetch globally
    global.fetch = jest.fn()

    // Mock window.dispatchEvent
    global.dispatchEvent = jest.fn()
  })

  afterEach(() => {
    stopSyncService()
    jest.useRealTimers()
  })

  describe('syncPendingSubmissions', () => {
    it('should return early if offline', async () => {
      mockOffline.isOnline.mockReturnValue(false)

      const result = await syncPendingSubmissions()

      expect(result).toEqual({ synced: 0, failed: 0, remaining: 0 })
      expect(mockOffline.getPendingSubmissions).not.toHaveBeenCalled()
    })

    it('should sync pending submissions successfully', async () => {
      const submissions = [
        {
          id: 1,
          url: '/api/test',
          method: 'POST',
          body: { data: 'test' },
          headers: { 'Content-Type': 'application/json' },
          retryCount: 0,
          timestamp: Date.now(),
        },
      ]

      mockOffline.getPendingSubmissions
        .mockResolvedValueOnce(submissions)
        .mockResolvedValueOnce([])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      })

      const result = await syncPendingSubmissions()

      expect(result.synced).toBe(1)
      expect(result.failed).toBe(0)
      expect(mockOffline.removeSubmission).toHaveBeenCalledWith(1)
      expect(global.dispatchEvent).toHaveBeenCalled()
    })

    it('should handle 4xx errors without retry', async () => {
      const submissions = [
        {
          id: 1,
          url: '/api/test',
          method: 'POST',
          body: { data: 'test' },
          headers: {},
          retryCount: 0,
          timestamp: Date.now(),
        },
      ]

      mockOffline.getPendingSubmissions
        .mockResolvedValueOnce(submissions)
        .mockResolvedValueOnce([])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
      })

      const result = await syncPendingSubmissions()

      expect(result.failed).toBe(1)
      expect(mockOffline.removeSubmission).toHaveBeenCalledWith(1)
      expect(mockOffline.incrementRetryCount).not.toHaveBeenCalled()
    })

    it('should handle 5xx errors with retry', async () => {
      const submissions = [
        {
          id: 1,
          url: '/api/test',
          method: 'POST',
          body: { data: 'test' },
          headers: {},
          retryCount: 0,
          timestamp: Date.now(),
        },
      ]

      mockOffline.getPendingSubmissions
        .mockResolvedValueOnce(submissions)
        .mockResolvedValueOnce([{ ...submissions[0], retryCount: 1 }])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      const result = await syncPendingSubmissions()

      expect(mockOffline.incrementRetryCount).toHaveBeenCalledWith(1)
      expect(result.remaining).toBe(1)
    })

    it('should remove submission after max retries', async () => {
      const submissions = [
        {
          id: 1,
          url: '/api/test',
          method: 'POST',
          body: { data: 'test' },
          headers: {},
          retryCount: 3, // At max retries
          timestamp: Date.now(),
        },
      ]

      mockOffline.getPendingSubmissions
        .mockResolvedValueOnce(submissions)
        .mockResolvedValueOnce([])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      })

      const result = await syncPendingSubmissions()

      expect(result.failed).toBe(1)
      expect(mockOffline.removeSubmission).toHaveBeenCalledWith(1)
    })

    it('should handle network errors', async () => {
      const submissions = [
        {
          id: 1,
          url: '/api/test',
          method: 'POST',
          body: { data: 'test' },
          headers: {},
          retryCount: 0,
          timestamp: Date.now(),
        },
      ]

      mockOffline.getPendingSubmissions
        .mockResolvedValueOnce(submissions)
        .mockResolvedValueOnce([{ ...submissions[0], retryCount: 1 }])

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await syncPendingSubmissions()

      expect(mockOffline.incrementRetryCount).toHaveBeenCalledWith(1)
    })
  })

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      mockOffline.getPendingSubmissions.mockResolvedValue([
        { id: 1, url: '/api/test', method: 'POST', body: {}, headers: {}, retryCount: 0, timestamp: Date.now() },
        { id: 2, url: '/api/test2', method: 'POST', body: {}, headers: {}, retryCount: 0, timestamp: Date.now() },
      ])
      mockOffline.isOnline.mockReturnValue(true)

      const status = await getSyncStatus()

      expect(status.pendingCount).toBe(2)
      expect(status.isOnline).toBe(true)
    })
  })

  describe('startSyncService / stopSyncService', () => {
    it('should start periodic sync', async () => {
      mockOffline.getPendingSubmissions.mockResolvedValue([])

      startSyncService()

      // Initial sync
      await Promise.resolve()
      expect(mockOffline.getPendingSubmissions).toHaveBeenCalled()
    })

    it('should stop sync service', () => {
      startSyncService()
      stopSyncService()

      // Clear previous calls
      mockOffline.getPendingSubmissions.mockClear()

      // Advance timers - should not trigger sync
      jest.advanceTimersByTime(60000)

      expect(mockOffline.getPendingSubmissions).not.toHaveBeenCalled()
    })

    it('should register network change listener', () => {
      startSyncService()

      expect(mockOffline.onNetworkChange).toHaveBeenCalled()
    })
  })
})
