// Notification Components
// Centralized exports for notification-related components

export { NotificationBell, NotificationItem } from './NotificationBell'

// Re-export types for convenience
export type {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  NotificationData,
  NotificationPreferences,
  NotificationTemplate,
  NotificationStats,
  CreateNotificationInput,
  NotificationFilters,
  EmailMessage,
  EmailSendResult,
  SMSMessage,
  SMSSendResult,
  PushMessage,
  PushSendResult,
  PushSubscription,
} from '@/types/notifications'
