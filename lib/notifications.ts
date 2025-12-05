import { prisma } from './prisma'
import type { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  facilityId: string
  type: NotificationType
  title: string
  message: string
  recipientUserId?: string
  recipientRoleId?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      facilityId: params.facilityId,
      type: params.type,
      title: params.title,
      message: params.message,
      recipientUserId: params.recipientUserId,
      recipientRoleId: params.recipientRoleId,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
    },
  })

  // If SMS is enabled and this is a critical notification, send SMS
  if (shouldSendSMS(params.type)) {
    await sendSMSNotification(params)
  }

  return notification
}

export async function createBroadcastNotification(
  facilityId: string,
  type: NotificationType,
  title: string,
  message: string,
  roleId?: string
) {
  // Get all users in the facility (optionally filtered by role)
  const users = await prisma.user.findMany({
    where: {
      facilityId,
      isActive: true,
      ...(roleId ? { roleId } : {}),
    },
    select: { id: true },
  })

  // Create notifications for all users
  const notifications = await prisma.notification.createMany({
    data: users.map((user) => ({
      facilityId,
      type,
      title,
      message,
      recipientUserId: user.id,
    })),
  })

  return notifications
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientUserId: userId,
    },
  })

  if (!notification) {
    throw new Error('Notification not found')
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

export async function markAllNotificationsAsRead(userId: string, facilityId: string) {
  return prisma.notification.updateMany({
    where: {
      recipientUserId: userId,
      facility: { id: facilityId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

export async function getUserNotifications(userId: string, facilityId: string, options?: {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options || {}

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        facilityId,
        OR: [
          { recipientUserId: userId },
          { recipientUserId: null }, // Broadcast notifications
        ],
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({
      where: {
        facilityId,
        OR: [
          { recipientUserId: userId },
          { recipientUserId: null },
        ],
        isRead: false,
      },
    }),
  ])

  return { notifications, unreadCount }
}

// Determine if a notification type should trigger SMS
function shouldSendSMS(type: NotificationType): boolean {
  const criticalTypes: NotificationType[] = [
    'INCIDENT_AMBULANCE',
    'AIR_QUALITY_EVACUATION',
    'SHIFT_EMERGENCY',
  ]
  return criticalTypes.includes(type)
}

// SMS sending function (to be implemented with actual provider)
async function sendSMSNotification(params: CreateNotificationParams) {
  try {
    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: params.facilityId },
    })

    if (!settings?.smsEnabled || !settings.smsProvider) {
      return
    }

    // Check quiet hours
    if (!params.type.includes('EVACUATION') && !params.type.includes('AMBULANCE')) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (settings.smsQuietHoursStart && settings.smsQuietHoursEnd) {
        if (currentTime >= settings.smsQuietHoursStart || currentTime <= settings.smsQuietHoursEnd) {
          if (!settings.smsCriticalOverride) {
            return // Skip SMS during quiet hours
          }
        }
      }
    }

    // Get recipients
    let recipients: { phone: string; userId: string }[] = []

    if (params.recipientUserId) {
      const user = await prisma.user.findUnique({
        where: { id: params.recipientUserId },
        select: { id: true, phone: true, smsOptIn: true, smsPreference: true },
      })
      if (user?.phone && user.smsOptIn && user.smsPreference !== 'NONE') {
        recipients.push({ phone: user.phone, userId: user.id })
      }
    } else if (params.recipientRoleId) {
      const users = await prisma.user.findMany({
        where: {
          roleId: params.recipientRoleId,
          isActive: true,
          smsOptIn: true,
          phone: { not: null },
          smsPreference: { not: 'NONE' },
        },
        select: { id: true, phone: true },
      })
      recipients = users.filter((u) => u.phone).map((u) => ({ phone: u.phone!, userId: u.id }))
    }

    // Send SMS to each recipient
    for (const recipient of recipients) {
      await sendSMS(settings, recipient.phone, params.message, params.type, recipient.userId)
    }
  } catch (error) {
    console.error('Failed to send SMS notification:', error)
  }
}

async function sendSMS(
  settings: { smsProvider: string | null; smsFromNumber: string | null; facilityId: string },
  toNumber: string,
  message: string,
  messageType: NotificationType,
  userId: string
) {
  // Log the SMS attempt
  const smsLog = await prisma.sMSLog.create({
    data: {
      facilityId: settings.facilityId,
      userId,
      phoneNumber: toNumber,
      messageType,
      messageBody: message,
      status: 'QUEUED',
    },
  })

  try {
    // Provider-specific implementation would go here
    // For now, we'll just simulate success
    switch (settings.smsProvider) {
      case 'twilio':
        // await sendViaTwilio(settings, toNumber, message)
        break
      case 'messagebird':
        // await sendViaMessageBird(settings, toNumber, message)
        break
      case 'vonage':
        // await sendViaVonage(settings, toNumber, message)
        break
      default:
        throw new Error(`Unknown SMS provider: ${settings.smsProvider}`)
    }

    // Update log on success
    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'SENT',
        statusUpdatedAt: new Date(),
      },
    })
  } catch (error) {
    // Update log on failure
    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'FAILED',
        statusUpdatedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}

// Air quality alert helpers
export async function checkAirQualityThresholds(
  facilityId: string,
  coLevel: number,
  no2Level: number
): Promise<{ warning: boolean; evacuation: boolean; type: 'CO' | 'NO2' | null }> {
  const settings = await prisma.facilitySettings.findUnique({
    where: { facilityId },
  })

  if (!settings?.enableAirQualityAlerts) {
    return { warning: false, evacuation: false, type: null }
  }

  // Check CO levels
  if (coLevel >= settings.coEvacuationPpm) {
    return { warning: false, evacuation: true, type: 'CO' }
  }
  if (coLevel >= settings.coWarningPpm) {
    return { warning: true, evacuation: false, type: 'CO' }
  }

  // Check NO2 levels
  if (no2Level >= settings.no2EvacuationPpm) {
    return { warning: false, evacuation: true, type: 'NO2' }
  }
  if (no2Level >= settings.no2WarningPpm) {
    return { warning: true, evacuation: false, type: 'NO2' }
  }

  return { warning: false, evacuation: false, type: null }
}

export async function triggerAirQualityAlert(
  facilityId: string,
  level: 'warning' | 'evacuation',
  gasType: 'CO' | 'NO2',
  reading: number
) {
  const notificationType: NotificationType = level === 'evacuation'
    ? 'AIR_QUALITY_EVACUATION'
    : 'AIR_QUALITY_WARNING'

  const title = level === 'evacuation'
    ? `EVACUATION REQUIRED - ${gasType} Level Critical`
    : `Air Quality Warning - Elevated ${gasType}`

  const message = level === 'evacuation'
    ? `IMMEDIATE ACTION REQUIRED: ${gasType} levels have reached ${reading} ppm. Begin evacuation procedures immediately.`
    : `${gasType} levels have reached ${reading} ppm. Monitor conditions and be prepared to evacuate if levels continue to rise.`

  // Broadcast to all staff
  await createBroadcastNotification(facilityId, notificationType, title, message)

  return { title, message, type: notificationType }
}
