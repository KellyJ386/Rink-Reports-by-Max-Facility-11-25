import { prisma } from './prisma'

// Notification delivery service
// Integrates with Twilio for SMS and could be extended for email/push

interface NotificationPayload {
  facilityId: string
  recipientUserId?: string
  recipientRoleId?: string
  type: string
  title: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
  priority?: 'normal' | 'high' | 'critical'
}

interface SMSPayload {
  to: string
  message: string
  facilityId: string
  userId?: string
  messageType: string
}

export async function createNotification(payload: NotificationPayload) {
  try {
    const notification = await prisma.notification.create({
      data: {
        facilityId: payload.facilityId,
        recipientUserId: payload.recipientUserId,
        recipientRoleId: payload.recipientRoleId,
        type: payload.type as any,
        title: payload.title,
        message: payload.message,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
      },
    })

    // If user specified, try to send SMS/Email
    if (payload.recipientUserId) {
      await deliverNotification(notification.id, payload.priority || 'normal')
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

export async function deliverNotification(notificationId: string, priority: string = 'normal') {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        facility: {
          include: { settings: true },
        },
      },
    })

    if (!notification) return

    // Get recipient user if specified
    if (notification.recipientUserId) {
      const user = await prisma.user.findUnique({
        where: { id: notification.recipientUserId },
      })

      if (!user) return

      // Check SMS preferences and settings
      const settings = notification.facility.settings
      const shouldSendSMS =
        settings?.smsEnabled &&
        user.smsOptIn &&
        user.phone &&
        user.phoneVerified &&
        shouldSendNow(settings, priority, user.smsPreference)

      if (shouldSendSMS) {
        await sendSMS({
          to: user.phone!,
          message: `${notification.title}: ${notification.message}`,
          facilityId: notification.facilityId,
          userId: user.id,
          messageType: notification.type,
        })
      }

      // TODO: Add email delivery here
      // await sendEmail(user.email, notification.title, notification.message)
    }

    // Mark as sent
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to deliver notification:', error)
  }
}

function shouldSendNow(
  settings: any,
  priority: string,
  userPreference: string
): boolean {
  // Critical notifications bypass quiet hours and preferences
  if (priority === 'critical') {
    return settings?.smsCriticalOverride !== false
  }

  // Check user preference
  if (userPreference === 'NONE') return false
  if (userPreference === 'CRITICAL_ONLY' && priority !== 'critical') return false

  // Check quiet hours
  if (settings?.smsQuietHoursStart && settings?.smsQuietHoursEnd) {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const quietStart = settings.smsQuietHoursStart
    const quietEnd = settings.smsQuietHoursEnd

    // Check if current time is in quiet hours
    if (quietStart < quietEnd) {
      // Normal case: quiet hours within same day (e.g., 22:00 - 07:00 next day)
      if (currentTime >= quietStart || currentTime < quietEnd) {
        return false
      }
    } else {
      // Overnight case
      if (currentTime >= quietStart && currentTime < quietEnd) {
        return false
      }
    }
  }

  return true
}

export async function sendSMS(payload: SMSPayload): Promise<boolean> {
  try {
    // Get facility settings for SMS provider config
    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: payload.facilityId },
    })

    if (!settings?.smsEnabled || !settings?.smsProvider) {
      console.log('SMS not configured for facility')
      return false
    }

    // Log the SMS attempt
    const smsLog = await prisma.sMSLog.create({
      data: {
        facilityId: payload.facilityId,
        userId: payload.userId,
        phoneNumber: payload.to,
        messageType: payload.messageType as any,
        messageBody: payload.message,
        status: 'QUEUED',
      },
    })

    // Here you would integrate with actual SMS provider
    // Example Twilio integration:
    /*
    if (settings.smsProvider === 'twilio') {
      const twilio = require('twilio')(settings.smsAccountSid, settings.smsAuthToken)

      const message = await twilio.messages.create({
        body: payload.message,
        from: settings.smsFromNumber,
        to: payload.to,
      })

      await prisma.sMSLog.update({
        where: { id: smsLog.id },
        data: {
          providerMessageId: message.sid,
          status: 'SENT',
          statusUpdatedAt: new Date(),
        },
      })

      return true
    }
    */

    // For now, just mark as sent (mock)
    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'SENT',
        statusUpdatedAt: new Date(),
      },
    })

    console.log(`[SMS Mock] To: ${payload.to}, Message: ${payload.message}`)
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}

// Broadcast notification to all users with a specific role or permission
export async function broadcastNotification(
  facilityId: string,
  type: string,
  title: string,
  message: string,
  options?: {
    roleId?: string
    permission?: { module: string; action: string }
    priority?: 'normal' | 'high' | 'critical'
    relatedEntityType?: string
    relatedEntityId?: string
  }
) {
  try {
    // Get users to notify
    let users

    if (options?.roleId) {
      users = await prisma.user.findMany({
        where: {
          facilityId,
          roleId: options.roleId,
          isActive: true,
        },
      })
    } else {
      users = await prisma.user.findMany({
        where: {
          facilityId,
          isActive: true,
        },
        include: { role: true },
      })

      // Filter by permission if specified
      if (options?.permission) {
        users = users.filter(user => {
          const permissions = user.role.permissions as any
          return permissions?.[options.permission!.module]?.[options.permission!.action]
        })
      }
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      users.map(user =>
        createNotification({
          facilityId,
          recipientUserId: user.id,
          type,
          title,
          message,
          priority: options?.priority,
          relatedEntityType: options?.relatedEntityType,
          relatedEntityId: options?.relatedEntityId,
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Failed to broadcast notification:', error)
    throw error
  }
}

// Schedule-specific notification helpers
export async function notifySchedulePublished(
  facilityId: string,
  userId: string,
  scheduleEntry: any
) {
  return createNotification({
    facilityId,
    recipientUserId: userId,
    type: 'SCHEDULE_PUBLISHED',
    title: 'Schedule Published',
    message: `Your schedule for ${new Date(scheduleEntry.date).toLocaleDateString()} has been published. Shift: ${scheduleEntry.startTime} - ${scheduleEntry.endTime}`,
    relatedEntityType: 'ScheduleEntry',
    relatedEntityId: scheduleEntry.id,
  })
}

export async function notifyOpenShift(
  facilityId: string,
  scheduleEntry: any,
  isEmergency: boolean = false
) {
  return broadcastNotification(
    facilityId,
    isEmergency ? 'SHIFT_EMERGENCY' : 'SHIFT_OPEN',
    isEmergency ? 'Emergency Coverage Needed' : 'Open Shift Available',
    `${isEmergency ? 'URGENT: ' : ''}Open shift available on ${new Date(scheduleEntry.date).toLocaleDateString()} from ${scheduleEntry.startTime} - ${scheduleEntry.endTime}`,
    {
      permission: { module: 'schedule', action: 'access' },
      priority: isEmergency ? 'critical' : 'normal',
      relatedEntityType: 'ScheduleEntry',
      relatedEntityId: scheduleEntry.id,
    }
  )
}

export async function notifyShiftClaimed(
  facilityId: string,
  userId: string,
  scheduleEntry: any
) {
  return createNotification({
    facilityId,
    recipientUserId: userId,
    type: 'SCHEDULE_PUBLISHED',
    title: 'Shift Claimed',
    message: `You have successfully claimed the shift on ${new Date(scheduleEntry.date).toLocaleDateString()} from ${scheduleEntry.startTime} - ${scheduleEntry.endTime}`,
    relatedEntityType: 'ScheduleEntry',
    relatedEntityId: scheduleEntry.id,
  })
}
