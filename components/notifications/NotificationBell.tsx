'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  AlertCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Settings,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Notification,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '@/types/notifications'

interface NotificationBellProps {
  userId?: string
  className?: string
  onNotificationClick?: (notification: Notification) => void
}

// Category icons
const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  SCHEDULE: Calendar,
  INCIDENTS: AlertCircle,
  AIR_QUALITY: AlertTriangle,
  REPORTS: FileText,
  SYSTEM: Bell,
  ADMIN: Settings,
}

// Priority colors
const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  LOW: 'text-muted-foreground',
  NORMAL: 'text-foreground',
  HIGH: 'text-yellow-600',
  URGENT: 'text-red-600',
}

// Priority badges
const PRIORITY_BADGES: Record<NotificationPriority, { label: string; className: string }> = {
  LOW: { label: '', className: '' },
  NORMAL: { label: '', className: '' },
  HIGH: { label: 'Important', className: 'bg-yellow-100 text-yellow-800' },
  URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
}

export function NotificationBell({
  userId,
  className,
  onNotificationClick,
}: NotificationBellProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    try {
      const res = await fetch(`/api/notifications?userId=${userId}&unreadOnly=false`)
      if (res.ok) {
        const data = await res.json()
        const prevCount = unreadCount
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)

        // Check for new notifications
        if (data.unreadCount > prevCount && prevCount > 0) {
          setHasNewNotification(true)
          if (soundEnabled) {
            playNotificationSound()
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [userId, unreadCount, soundEnabled])

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications()

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Reset new notification indicator when opening
  useEffect(() => {
    if (isOpen) {
      setHasNewNotification(false)
    }
  }, [isOpen])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: 'READ', readAt: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          status: 'READ' as const,
          readAt: new Date().toISOString(),
        }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === 'UNREAD') {
      await markAsRead(notification.id)
    }

    // Call callback if provided
    onNotificationClick?.(notification)

    // Navigate if action URL provided
    if (notification.actionUrl) {
      setIsOpen(false)
      router.push(notification.actionUrl)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      const wasUnread = notifications.find((n) => n.id === notificationId)?.status === 'UNREAD'
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      })
    } catch (error) {
      // Audio not supported
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Group notifications
  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      const isToday = new Date(notification.createdAt).toDateString() === new Date().toDateString()
      const key = isToday ? 'today' : 'earlier'
      if (!acc[key]) acc[key] = []
      acc[key].push(notification)
      return acc
    },
    {} as Record<string, Notification[]>
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className={cn('h-5 w-5', hasNewNotification && 'animate-bounce')} />
          {unreadCount > 0 && (
            <Badge
              className={cn(
                'absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center',
                'bg-red-500 text-white hover:bg-red-500'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
                disabled={isLoading}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length > 0 ? (
            <div>
              {groupedNotifications.today?.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    Today
                  </div>
                  {groupedNotifications.today.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDelete={() => deleteNotification(notification.id)}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ))}
                </div>
              )}

              {groupedNotifications.earlier?.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    Earlier
                  </div>
                  {groupedNotifications.earlier.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDelete={() => deleteNotification(notification.id)}
                      formatTimeAgo={formatTimeAgo}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <BellOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-between text-sm"
            onClick={() => {
              setIsOpen(false)
              router.push('/dashboard/notifications')
            }}
          >
            View all notifications
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Individual notification item
interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onDelete: () => void
  formatTimeAgo: (date: string) => string
}

function NotificationItem({
  notification,
  onClick,
  onDelete,
  formatTimeAgo,
}: NotificationItemProps) {
  const CategoryIcon = CATEGORY_ICONS[notification.category]
  const priorityBadge = PRIORITY_BADGES[notification.priority]
  const isUnread = notification.status === 'UNREAD'

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors relative group',
        isUnread && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
          notification.priority === 'URGENT'
            ? 'bg-red-100 text-red-600'
            : notification.priority === 'HIGH'
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <CategoryIcon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={cn(
                'text-sm line-clamp-1',
                isUnread ? 'font-semibold' : 'font-medium'
              )}
            >
              {notification.title}
            </p>
            {priorityBadge.label && (
              <Badge className={cn('text-[10px] px-1.5 py-0 h-4 mt-0.5', priorityBadge.className)}>
                {priorityBadge.label}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        {notification.actionLabel && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs mt-1"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
          >
            {notification.actionLabel}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Export additional components
export { NotificationItem }
