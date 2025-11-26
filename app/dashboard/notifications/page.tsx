'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Notification {
  id: string
  facilityId: string
  recipientUserId: string | null
  recipientRoleId: string | null
  type: string
  title: string
  message: string
  relatedEntityType: string | null
  relatedEntityId: string | null
  isRead: boolean
  sentAt: string
  readAt: string | null
  emailSent: boolean
  emailSentAt: string | null
}

interface NotificationPreferences {
  id: string
  email: string
  phone: string | null
  phoneVerified: boolean
  smsOptIn: boolean
  smsPreference: 'ALL' | 'CRITICAL_ONLY' | 'NONE'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications')

  // Form state for preferences
  const [phone, setPhone] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [smsPreference, setSmsPreference] = useState<'ALL' | 'CRITICAL_ONLY' | 'NONE'>('CRITICAL_ONLY')

  // Mock user ID - in production this would come from session
  const currentUserId = 'user-123'
  const facilityId = 'facility-demo'

  useEffect(() => {
    fetchNotifications()
    fetchPreferences()
  }, [showUnreadOnly])

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({
        userId: currentUserId,
        unreadOnly: showUnreadOnly.toString(),
      })

      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const result = await response.json()
      setNotifications(result.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      alert('Failed to load notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`/api/notifications/preferences?userId=${currentUserId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }
      const result = await response.json()
      setPreferences(result.preferences)

      // Set form state
      setPhone(result.preferences.phone || '')
      setSmsOptIn(result.preferences.smsOptIn)
      setSmsPreference(result.preferences.smsPreference)
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      alert('Failed to mark notification as read.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead)

      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          })
        )
      )

      fetchNotifications()
      alert('All notifications marked as read!')
    } catch (error) {
      console.error('Error marking all as read:', error)
      alert('Failed to mark all notifications as read.')
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      alert('Notification deleted!')
    } catch (error) {
      console.error('Error deleting notification:', error)
      alert('Failed to delete notification.')
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          phone,
          smsOptIn,
          smsPreference,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save preferences')
      }

      alert('Notification preferences saved successfully!')
      fetchPreferences()
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert(error instanceof Error ? error.message : 'Failed to save preferences. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INCIDENT_AMBULANCE':
      case 'SHIFT_EMERGENCY':
        return '🚨'
      case 'AIR_QUALITY_WARNING':
      case 'AIR_QUALITY_EVACUATION':
        return '⚠️'
      case 'SCHEDULE_PUBLISHED':
        return '📅'
      case 'SHIFT_OPEN':
        return '📢'
      case 'INCIDENT_SUBMITTED':
        return '📝'
      case 'REPORT_REMINDER':
        return '🔔'
      default:
        return '📩'
    }
  }

  const getNotificationBadge = (type: string) => {
    const criticalTypes = ['INCIDENT_AMBULANCE', 'AIR_QUALITY_EVACUATION', 'SHIFT_EMERGENCY']
    if (criticalTypes.includes(type)) {
      return <Badge variant="destructive">Critical</Badge>
    }

    const warningTypes = ['AIR_QUALITY_WARNING', 'INCIDENT_SUBMITTED']
    if (warningTypes.includes(type)) {
      return <Badge variant="warning">Important</Badge>
    }

    return <Badge variant="default">Info</Badge>
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Notifications</h1>
          <p className="text-wolf-600 mt-2">Manage your notifications and preferences</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading notifications...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-wolf-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">Notifications</h1>
        <p className="text-wolf-600 mt-2">Manage your notifications and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-wolf-200">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'text-action-green border-b-2 border-action-green'
              : 'text-wolf-600 hover:text-navy'
          }`}
        >
          Notifications {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-action-green border-b-2 border-action-green'
              : 'text-wolf-600 hover:text-navy'
          }`}
        >
          Settings
        </button>
      </div>

      {activeTab === 'notifications' && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="unreadOnly"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="unreadOnly" className="text-sm text-navy">
                  Show unread only
                </label>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-wolf-600">No notifications to display.</p>
                  <p className="text-sm text-wolf-500 mt-1">
                    {showUnreadOnly
                      ? 'All caught up! No unread notifications.'
                      : "You'll be notified here when there's something important."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notification.isRead
                          ? 'bg-white border-wolf-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-navy">{notification.title}</h3>
                              {getNotificationBadge(notification.type)}
                              {!notification.isRead && (
                                <Badge variant="default" className="bg-blue-500">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-wolf-600 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-3 text-xs text-wolf-500">
                              <span>{formatDate(notification.sentAt)}</span>
                              {notification.emailSent && <span>• Email sent</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              variant="outline"
                              size="sm"
                            >
                              Mark as read
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteNotification(notification.id)}
                            variant="outline"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'settings' && (
        <>
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePreferences} className="space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="font-semibold text-navy mb-3">Email Notifications</h3>
                  <div className="bg-wolf-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-navy">Email Address</p>
                        <p className="text-sm text-wolf-600">{preferences?.email}</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-sm text-wolf-500 mt-3">
                      You will receive email notifications for all schedule updates, incidents, and important alerts.
                    </p>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div>
                  <h3 className="font-semibold text-navy mb-3">SMS Notifications</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                        placeholder="+1 (555) 123-4567"
                      />
                      {preferences?.phoneVerified ? (
                        <p className="text-xs text-green-600 mt-1">✓ Phone number verified</p>
                      ) : (
                        <p className="text-xs text-wolf-500 mt-1">Phone number not verified</p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="smsOptIn"
                        checked={smsOptIn}
                        onChange={(e) => setSmsOptIn(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="smsOptIn" className="text-sm text-navy">
                        Enable SMS notifications
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy mb-2">
                        SMS Preference
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="sms-all"
                            name="smsPreference"
                            value="ALL"
                            checked={smsPreference === 'ALL'}
                            onChange={(e) => setSmsPreference('ALL')}
                            disabled={!smsOptIn}
                            className="mr-2"
                          />
                          <label htmlFor="sms-all" className="text-sm text-navy">
                            All notifications (schedules, reminders, alerts)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="sms-critical"
                            name="smsPreference"
                            value="CRITICAL_ONLY"
                            checked={smsPreference === 'CRITICAL_ONLY'}
                            onChange={(e) => setSmsPreference('CRITICAL_ONLY')}
                            disabled={!smsOptIn}
                            className="mr-2"
                          />
                          <label htmlFor="sms-critical" className="text-sm text-navy">
                            Critical only (emergencies, ambulance, evacuation)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="sms-none"
                            name="smsPreference"
                            value="NONE"
                            checked={smsPreference === 'NONE'}
                            onChange={(e) => setSmsPreference('NONE')}
                            disabled={!smsOptIn}
                            className="mr-2"
                          />
                          <label htmlFor="sms-none" className="text-sm text-navy">
                            No SMS notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h3 className="font-semibold text-navy mb-3">Notification Types</h3>
                  <div className="bg-wolf-50 p-4 rounded-lg space-y-2 text-sm text-wolf-600">
                    <p>• <strong>Schedule Published:</strong> When new schedules are available</p>
                    <p>• <strong>Open Shifts:</strong> When shifts become available to claim</p>
                    <p>• <strong>Emergency Shifts:</strong> When urgent coverage is needed</p>
                    <p>• <strong>Incident Alerts:</strong> When incidents are reported</p>
                    <p>• <strong>Air Quality Warnings:</strong> When air quality thresholds are exceeded</p>
                    <p>• <strong>Report Reminders:</strong> When reports are due</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-wolf-200">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
