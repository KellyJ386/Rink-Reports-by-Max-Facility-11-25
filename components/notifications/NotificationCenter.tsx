'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  sentAt: string
  relatedEntityType?: string
  relatedEntityId?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchNotifications(true)
  }, [filter])

  const fetchNotifications = async (reset = false) => {
    setLoading(true)
    try {
      const newOffset = reset ? 0 : offset
      const res = await fetch(
        `/api/notifications?limit=20&offset=${newOffset}&unreadOnly=${filter === 'unread'}`
      )
      if (res.ok) {
        const data = await res.json()
        if (reset) {
          setNotifications(data.notifications)
        } else {
          setNotifications((prev) => [...prev, ...data.notifications])
        }
        setUnreadCount(data.unreadCount)
        setHasMore(data.notifications.length === 20)
        setOffset(newOffset + data.notifications.length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INCIDENT_SUBMITTED':
        return { icon: '📋', bg: 'bg-blue-100', color: 'text-blue-600' }
      case 'INCIDENT_AMBULANCE':
        return { icon: '🚑', bg: 'bg-red-100', color: 'text-red-600' }
      case 'AIR_QUALITY_WARNING':
        return { icon: '⚠️', bg: 'bg-yellow-100', color: 'text-yellow-600' }
      case 'AIR_QUALITY_EVACUATION':
        return { icon: '🚨', bg: 'bg-red-100', color: 'text-red-600' }
      case 'SCHEDULE_PUBLISHED':
        return { icon: '📅', bg: 'bg-purple-100', color: 'text-purple-600' }
      case 'SHIFT_OPEN':
        return { icon: '📢', bg: 'bg-orange-100', color: 'text-orange-600' }
      case 'SHIFT_EMERGENCY':
        return { icon: '🆘', bg: 'bg-red-100', color: 'text-red-600' }
      case 'REPORT_REMINDER':
        return { icon: '⏰', bg: 'bg-gray-100', color: 'text-gray-600' }
      default:
        return { icon: '🔔', bg: 'bg-gray-100', color: 'text-gray-600' }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isCritical = (type: string) => {
    return type.includes('EVACUATION') || type.includes('AMBULANCE') || type.includes('EMERGENCY')
  }

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.sentAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let groupKey: string
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday'
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'unread'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notifications list */}
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
          <p className="text-gray-600 mt-2">
            {filter === 'unread' ? "You've read all your notifications" : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
              <div className="space-y-2">
                {items.map((notification) => {
                  const iconConfig = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                      className={`card p-4 cursor-pointer transition-all hover:shadow-md ${
                        notification.isRead ? '' : 'ring-2 ring-blue-200'
                      } ${isCritical(notification.type) ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${iconConfig.bg}`}>
                          {iconConfig.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {formatDate(notification.sentAt)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchNotifications(false)}
                disabled={loading}
                className="btn btn-secondary"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
