// Notification Service
// Core service for creating, sending, and managing notifications

import { v4 as uuidv4 } from 'uuid'
import {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  NotificationData,
  NotificationPreferences,
  NotificationTemplate,
  CreateNotificationInput,
  NotificationFilters,
  NotificationStats,
  NOTIFICATION_TEMPLATES,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notifications'

// ============================================
// IN-MEMORY STORAGE (Replace with DB in production)
// ============================================

const notifications = new Map<string, Notification>()
const userPreferences = new Map<string, NotificationPreferences>()

// ============================================
// TEMPLATE ENGINE
// ============================================

/**
 * Simple template engine to replace {{variables}} in strings
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    if (value === undefined || value === null) {
      return ''
    }
    return String(value)
  })
}

/**
 * Get category for a notification type
 */
export function getCategoryForType(type: NotificationType): NotificationCategory {
  const template = NOTIFICATION_TEMPLATES[type]
  return template?.category || 'SYSTEM'
}

/**
 * Get default priority for a notification type
 */
export function getDefaultPriority(type: NotificationType): NotificationPriority {
  const template = NOTIFICATION_TEMPLATES[type]
  return template?.defaultPriority || 'NORMAL'
}

// ============================================
// NOTIFICATION SERVICE
// ============================================

export class NotificationService {
  /**
   * Create a notification from a template
   */
  static async create(input: CreateNotificationInput): Promise<Notification[]> {
    const template = NOTIFICATION_TEMPLATES[input.type]
    if (!template) {
      throw new Error(`Unknown notification type: ${input.type}`)
    }

    const createdNotifications: Notification[] = []

    // Determine recipients
    const recipientIds = input.recipientIds || (input.recipientId ? [input.recipientId] : [])

    if (recipientIds.length === 0 && input.recipientType === 'BROADCAST') {
      // For broadcast, this would fetch all users
      // For demo, we'll create a single notification
      recipientIds.push('all')
    }

    // Create notification for each recipient
    for (const recipientId of recipientIds) {
      // Check user preferences
      const prefs = await this.getUserPreferences(recipientId)
      const shouldNotify = this.shouldNotifyUser(
        prefs,
        template.category,
        input.type,
        input.priority || template.defaultPriority
      )

      if (!shouldNotify.enabled) {
        continue
      }

      // Determine channels
      let channels = input.channels || shouldNotify.channels || template.defaultChannels

      // Check quiet hours
      if (this.isInQuietHours(prefs) && !prefs.quietHoursExcludeUrgent) {
        // During quiet hours, only send in-app
        channels = channels.filter((c) => c === 'IN_APP')
      } else if (
        this.isInQuietHours(prefs) &&
        prefs.quietHoursExcludeUrgent &&
        (input.priority === 'URGENT' || template.defaultPriority === 'URGENT')
      ) {
        // Allow urgent notifications during quiet hours
      }

      // Build template data
      const templateData = {
        ...input.data,
        ...input.data?.metadata,
      } as Record<string, unknown>

      // Render title and message
      const title = input.customTitle || renderTemplate(template.titleTemplate, templateData)
      const message = input.customMessage || renderTemplate(template.messageTemplate, templateData)

      // Render action URL
      const actionUrl = input.actionUrl ||
        (template.defaultActionUrl ? renderTemplate(template.defaultActionUrl, templateData) : undefined)

      const notification: Notification = {
        id: uuidv4(),
        type: input.type,
        category: template.category,
        priority: input.priority || template.defaultPriority,
        status: 'UNREAD',
        title,
        message,
        data: input.data,
        recipientId,
        recipientType: input.recipientType || 'USER',
        channels,
        actionUrl,
        actionLabel: input.actionLabel || template.defaultActionLabel,
        expiresAt: input.expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Store notification
      notifications.set(notification.id, notification)
      createdNotifications.push(notification)

      // Send through channels
      await this.sendThroughChannels(notification, prefs, template)
    }

    return createdNotifications
  }

  /**
   * Send notification through configured channels
   */
  private static async sendThroughChannels(
    notification: Notification,
    prefs: NotificationPreferences,
    template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const channels = notification.channels

    // In-app is handled by storing the notification
    if (channels.includes('IN_APP')) {
      notification.sentAt = new Date().toISOString()
    }

    // Email
    if (channels.includes('EMAIL') && prefs.emailEnabled && prefs.emailAddress) {
      try {
        const { sendEmail } = await import('./email')
        const templateData = {
          ...notification.data,
          ...notification.data?.metadata,
        } as Record<string, unknown>

        await sendEmail({
          to: prefs.emailAddress,
          subject: template.emailSubjectTemplate
            ? renderTemplate(template.emailSubjectTemplate, templateData)
            : notification.title,
          html: template.emailBodyTemplate
            ? renderTemplate(template.emailBodyTemplate, templateData)
            : `<h2>${notification.title}</h2><p>${notification.message}</p>`,
        })
      } catch (error) {
        console.error('Failed to send email notification:', error)
      }
    }

    // SMS
    if (channels.includes('SMS') && prefs.smsEnabled && prefs.phoneNumber) {
      try {
        const { sendSMS } = await import('./sms')
        const templateData = {
          ...notification.data,
          ...notification.data?.metadata,
        } as Record<string, unknown>

        await sendSMS({
          to: prefs.phoneNumber,
          body: template.smsTemplate
            ? renderTemplate(template.smsTemplate, templateData)
            : `${notification.title}: ${notification.message}`,
        })
      } catch (error) {
        console.error('Failed to send SMS notification:', error)
      }
    }

    // Push notifications
    if (channels.includes('PUSH') && prefs.pushEnabled) {
      try {
        const { sendPushNotification } = await import('./push')
        await sendPushNotification(notification.recipientId, {
          title: notification.title,
          body: notification.message,
          data: {
            notificationId: notification.id,
            actionUrl: notification.actionUrl,
          },
        })
      } catch (error) {
        console.error('Failed to send push notification:', error)
      }
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    // Check cache
    if (userPreferences.has(userId)) {
      return userPreferences.get(userId)!
    }

    // Return default preferences for demo
    const defaultPrefs: NotificationPreferences = {
      id: uuidv4(),
      userId,
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    userPreferences.set(userId, defaultPrefs)
    return defaultPrefs
  }

  /**
   * Update user notification preferences
   */
  static async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId)
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      id: current.id,
      userId: current.userId,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    userPreferences.set(userId, updated)
    return updated
  }

  /**
   * Check if user should be notified based on preferences
   */
  private static shouldNotifyUser(
    prefs: NotificationPreferences,
    category: NotificationCategory,
    type: NotificationType,
    priority: NotificationPriority
  ): { enabled: boolean; channels: NotificationChannel[] } {
    // Check type-specific override first
    if (prefs.typeOverrides?.[type]) {
      const override = prefs.typeOverrides[type]!
      return {
        enabled: override.enabled,
        channels: override.channels || prefs.categories[category].channels,
      }
    }

    // Check category preferences
    const categoryPref = prefs.categories[category]
    if (!categoryPref.enabled) {
      return { enabled: false, channels: [] }
    }

    // Check priority threshold
    const priorityOrder: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    const minPriorityIndex = priorityOrder.indexOf(categoryPref.priority)
    const notificationPriorityIndex = priorityOrder.indexOf(priority)

    if (notificationPriorityIndex < minPriorityIndex) {
      return { enabled: false, channels: [] }
    }

    return {
      enabled: true,
      channels: categoryPref.channels,
    }
  }

  /**
   * Check if currently in quiet hours
   */
  private static isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number)
    const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number)

    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime
    }

    return currentTime >= startTime && currentTime < endTime
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    let results = Array.from(notifications.values()).filter(
      (n) => n.recipientId === userId || n.recipientId === 'all'
    )

    // Apply filters
    if (filters.status) {
      results = results.filter((n) => n.status === filters.status)
    }
    if (filters.category) {
      results = results.filter((n) => n.category === filters.category)
    }
    if (filters.type) {
      results = results.filter((n) => n.type === filters.type)
    }
    if (filters.priority) {
      results = results.filter((n) => n.priority === filters.priority)
    }
    if (filters.unreadOnly) {
      results = results.filter((n) => n.status === 'UNREAD')
    }
    if (filters.startDate) {
      results = results.filter((n) => n.createdAt >= filters.startDate!)
    }
    if (filters.endDate) {
      results = results.filter((n) => n.createdAt <= filters.endDate!)
    }

    // Sort by created date descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return results
  }

  /**
   * Get notification by ID
   */
  static async getById(id: string): Promise<Notification | null> {
    return notifications.get(id) || null
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = notifications.get(notificationId)
    if (!notification || notification.recipientId !== userId) {
      return null
    }

    notification.status = 'READ'
    notification.readAt = new Date().toISOString()
    notification.updatedAt = new Date().toISOString()
    notifications.set(notificationId, notification)

    return notification
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    let count = 0
    notifications.forEach((notification) => {
      if (notification.recipientId === userId && notification.status === 'UNREAD') {
        notification.status = 'READ'
        notification.readAt = new Date().toISOString()
        notification.updatedAt = new Date().toISOString()
        count++
      }
    })
    return count
  }

  /**
   * Archive notification
   */
  static async archive(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = notifications.get(notificationId)
    if (!notification || notification.recipientId !== userId) {
      return null
    }

    notification.status = 'ARCHIVED'
    notification.updatedAt = new Date().toISOString()
    notifications.set(notificationId, notification)

    return notification
  }

  /**
   * Delete notification
   */
  static async delete(notificationId: string, userId: string): Promise<boolean> {
    const notification = notifications.get(notificationId)
    if (!notification || notification.recipientId !== userId) {
      return false
    }

    notifications.delete(notificationId)
    return true
  }

  /**
   * Get notification statistics for a user
   */
  static async getStats(userId: string): Promise<NotificationStats> {
    const userNotifications = Array.from(notifications.values()).filter(
      (n) => n.recipientId === userId || n.recipientId === 'all'
    )

    const stats: NotificationStats = {
      total: userNotifications.length,
      unread: userNotifications.filter((n) => n.status === 'UNREAD').length,
      byCategory: {
        SCHEDULE: 0,
        INCIDENTS: 0,
        AIR_QUALITY: 0,
        REPORTS: 0,
        SYSTEM: 0,
        ADMIN: 0,
      },
      byPriority: {
        LOW: 0,
        NORMAL: 0,
        HIGH: 0,
        URGENT: 0,
      },
    }

    userNotifications.forEach((n) => {
      stats.byCategory[n.category]++
      stats.byPriority[n.priority]++
    })

    return stats
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return Array.from(notifications.values()).filter(
      (n) => (n.recipientId === userId || n.recipientId === 'all') && n.status === 'UNREAD'
    ).length
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create and send a notification (convenience function)
 */
export async function notify(input: CreateNotificationInput): Promise<Notification[]> {
  return NotificationService.create(input)
}

/**
 * Send incident notification
 */
export async function notifyIncidentSubmitted(
  incidentId: string,
  facilityName: string,
  submittedBy: string,
  managerIds: string[]
): Promise<void> {
  await notify({
    type: 'INCIDENT_SUBMITTED',
    recipientIds: managerIds,
    data: {
      entityType: 'INCIDENT',
      entityId: incidentId,
      facilityName,
      submittedBy: { id: '', name: submittedBy },
      metadata: {
        incidentId,
        facilityName,
        submittedBy,
        date: new Date().toISOString(),
      },
    },
  })
}

/**
 * Send shift assignment notification
 */
export async function notifyShiftAssigned(
  shiftId: string,
  shiftName: string,
  shiftDate: string,
  shiftTime: string,
  facilityName: string,
  employeeId: string
): Promise<void> {
  await notify({
    type: 'SHIFT_ASSIGNED',
    recipientId: employeeId,
    data: {
      entityType: 'SHIFT',
      entityId: shiftId,
      entityName: shiftName,
      shiftDate,
      shiftTime,
      facilityName,
      metadata: {
        shiftId,
        shiftName,
        shiftDate,
        shiftTime,
        facilityName,
      },
    },
  })
}

/**
 * Send air quality alert
 */
export async function notifyAirQualityAlert(
  level: 'WARNING' | 'CRITICAL' | 'EVACUATION',
  gasType: string,
  currentLevel: number,
  threshold: number,
  facilityName: string,
  recipientIds: string[]
): Promise<void> {
  const typeMap: Record<string, NotificationType> = {
    WARNING: 'AIR_QUALITY_WARNING',
    CRITICAL: 'AIR_QUALITY_CRITICAL',
    EVACUATION: 'AIR_QUALITY_EVACUATION',
  }

  await notify({
    type: typeMap[level],
    recipientIds,
    data: {
      facilityName,
      airQualityLevel: currentLevel,
      threshold,
      metadata: {
        gasType,
        level: currentLevel,
        threshold,
        facilityName,
      },
    },
  })
}

/**
 * Send schedule published notification
 */
export async function notifySchedulePublished(
  scheduleId: string,
  schedulePeriod: string,
  employeeShifts: { employeeId: string; shiftCount: number }[]
): Promise<void> {
  for (const { employeeId, shiftCount } of employeeShifts) {
    await notify({
      type: 'SCHEDULE_PUBLISHED',
      recipientId: employeeId,
      data: {
        entityType: 'SCHEDULE',
        entityId: scheduleId,
        metadata: {
          schedulePeriod,
          shiftCount,
          scheduleId,
        },
      },
    })
  }
}
