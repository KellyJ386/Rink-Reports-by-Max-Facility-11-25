'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

const TYPE_STYLES: Record<string, { icon: string; color: string }> = {
  info: { icon: 'i', color: 'bg-blue-100 text-blue-800' },
  success: { icon: '✓', color: 'bg-green-100 text-green-800' },
  warning: { icon: '!', color: 'bg-yellow-100 text-yellow-800' },
  error: { icon: '✕', color: 'bg-red-100 text-red-800' },
  alert: { icon: '🔔', color: 'bg-purple-100 text-purple-800' },
}

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (offset = 0, append = false) => {
    try {
      if (offset > 0) setLoadingMore(true)

      const unreadOnly = filter === 'unread' ? '&unreadOnly=true' : ''
      const [meRes, notificationsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/notifications?limit=${PAGE_SIZE}&offset=${offset}${unreadOnly}`),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        if (append) {
          setNotifications(prev => [...prev, ...(data.notifications || [])])
        } else {
          setNotifications(data.notifications || [])
        }
        setTotal(data.total || 0)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [router, filter])

  useEffect(() => {
    setLoading(true)
    setDisplayCount(PAGE_SIZE)
    fetchNotifications()
  }, [fetchNotifications])

  const loadMore = () => {
    fetchNotifications(notifications.length, true)
  }

  const handleShowMore = () => {
    if (displayCount < notifications.length) {
      setDisplayCount(Math.min(displayCount + PAGE_SIZE, notifications.length))
    } else if (notifications.length < total) {
      loadMore()
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const notification = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        setTotal(prev => prev - 1)
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const hasMore = displayCount < notifications.length || notifications.length < total

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  const displayedNotifications = notifications.slice(0, displayCount)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary text-sm">
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-4xl mb-3">🔔</div>
          <p className="text-gray-500 mb-2">No notifications</p>
          <p className="text-gray-400 text-sm">
            {filter === 'unread' ? 'All notifications have been read' : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedNotifications.map((notification) => {
              const typeStyle = TYPE_STYLES[notification.type] || TYPE_STYLES.info

              return (
                <div
                  key={notification.id}
                  className={`card flex items-start gap-4 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${typeStyle.color}`}
                  >
                    {typeStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Show count and Load More */}
          {total > 0 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 mb-3">
                Showing {displayedNotifications.length} of {total}
              </p>
              {hasMore && (
                <button
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="btn btn-secondary"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
