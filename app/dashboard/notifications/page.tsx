'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  sentAt: string
  readAt: string | null
  relatedEntityType?: string
  relatedEntityId?: string
}

type FilterType = 'all' | 'unread' | 'read'

const NOTIFICATION_ICONS: Record<string, string> = {
  INCIDENT_SUBMITTED: '⚠️',
  INCIDENT_AMBULANCE: '🚑',
  AIR_QUALITY_WARNING: '🌡️',
  AIR_QUALITY_EVACUATION: '🚨',
  SCHEDULE_PUBLISHED: '📅',
  SHIFT_OPEN: '📋',
  SHIFT_EMERGENCY: '🆘',
  REPORT_REMINDER: '📝',
  SYSTEM: '🔔'
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  INCIDENT_SUBMITTED: 'Incident',
  INCIDENT_AMBULANCE: 'Emergency',
  AIR_QUALITY_WARNING: 'Air Quality Warning',
  AIR_QUALITY_EVACUATION: 'Air Quality Emergency',
  SCHEDULE_PUBLISHED: 'Schedule',
  SHIFT_OPEN: 'Open Shift',
  SHIFT_EMERGENCY: 'Emergency Coverage',
  REPORT_REMINDER: 'Reminder',
  SYSTEM: 'System'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchNotifications = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: currentOffset.toString()
      })

      if (filter === 'unread') {
        params.set('unreadOnly', 'true')
      }

      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()

        if (reset) {
          setNotifications(data.notifications)
          setOffset(data.notifications.length)
        } else {
          setNotifications(prev => [...prev, ...data.notifications])
          setOffset(currentOffset + data.notifications.length)
        }

        setTotal(data.total)
        setUnreadCount(data.unreadCount)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filter, offset])

  useEffect(() => {
    fetchNotifications(true)
  }, [filter])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setTotal(prev => prev - 1)
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const getNotificationLink = (notification: Notification): string | null => {
    if (!notification.relatedEntityType) return null

    switch (notification.relatedEntityType) {
      case 'ScheduleEntry':
        return '/dashboard/schedule'
      case 'Incident':
        return '/dashboard/incidents'
      case 'IceDepthReading':
        return '/dashboard/ice-depth'
      default:
        return null
    }
  }

  const filteredNotifications = filter === 'read'
    ? notifications.filter(n => n.isRead)
    : notifications

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-gray-500">
            {filter === 'unread'
              ? 'You\'re all caught up!'
              : 'Notifications will appear here when you receive them.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map(notification => {
            const link = getNotificationLink(notification)

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm overflow-hidden transition-colors ${
                  !notification.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex gap-4">
                    <span className="text-2xl flex-shrink-0">
                      {NOTIFICATION_ICONS[notification.type] || '🔔'}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.sentAt)}
                            {notification.readAt && (
                              <span className="ml-2">• Read {formatDate(notification.readAt)}</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Mark read
                            </button>
                          )}
                          {link && (
                            <Link
                              href={link}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              View
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-sm text-gray-400 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={() => fetchNotifications(false)}
                disabled={loadingMore}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
