/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/notifications/route'
import * as auth from '@/lib/auth'
import * as notifications from '@/lib/notifications'

// Mock modules
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/notifications', () => ({
  getUserNotifications: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}))

describe('Notifications API Routes', () => {
  const mockAuth = auth as jest.Mocked<typeof auth>
  const mockNotifications = notifications as jest.Mocked<typeof notifications>

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    facilityId: 'facility-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/notifications', () => {
    const createGetRequest = (params?: Record<string, string>) => {
      const url = new URL('http://localhost:3000/api/notifications')
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value)
        })
      }
      return new NextRequest(url, { method: 'GET' })
    }

    it('should return 401 if not authenticated', async () => {
      mockAuth.getSession.mockResolvedValue(null)

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return notifications for authenticated user', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)
      mockNotifications.getUserNotifications.mockResolvedValue({
        notifications: [
          { id: '1', title: 'Test', message: 'Test message', isRead: false },
        ],
        unreadCount: 1,
      })

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications).toHaveLength(1)
      expect(data.unreadCount).toBe(1)
    })

    it('should pass query parameters to getUserNotifications', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)
      mockNotifications.getUserNotifications.mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      })

      const request = createGetRequest({
        unreadOnly: 'true',
        limit: '10',
        offset: '5',
      })

      await GET(request)

      expect(mockNotifications.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        'facility-1',
        { unreadOnly: true, limit: 10, offset: 5 }
      )
    })

    it('should use default values for missing parameters', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)
      mockNotifications.getUserNotifications.mockResolvedValue({
        notifications: [],
        unreadCount: 0,
      })

      const request = createGetRequest()
      await GET(request)

      expect(mockNotifications.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        'facility-1',
        { unreadOnly: false, limit: 20, offset: 0 }
      )
    })

    it('should return 500 on error', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)
      mockNotifications.getUserNotifications.mockRejectedValue(new Error('DB error'))

      const request = createGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch notifications')
    })
  })

  describe('POST /api/notifications', () => {
    const createPostRequest = (body: unknown) =>
      new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })

    it('should return 401 if not authenticated', async () => {
      mockAuth.getSession.mockResolvedValue(null)

      const request = createPostRequest({ action: 'markAllRead' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should mark all notifications as read', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)
      mockNotifications.markAllNotificationsAsRead.mockResolvedValue(undefined)

      const request = createPostRequest({ action: 'markAllRead' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockNotifications.markAllNotificationsAsRead).toHaveBeenCalledWith(
        'user-1',
        'facility-1'
      )
    })

    it('should return 400 for invalid action', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)

      const request = createPostRequest({ action: 'invalidAction' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    it('should return 500 on error', async () => {
      mockAuth.getSession.mockResolvedValue(mockUser as any)
      mockNotifications.markAllNotificationsAsRead.mockRejectedValue(new Error('DB error'))

      const request = createPostRequest({ action: 'markAllRead' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update notifications')
    })
  })
})
