// Notification Service
// Infrastructure for sending notifications (SMS, Email, In-App)
// Note: Actual SMS/Email sending requires integration with Twilio/SendGrid

import { prisma } from './prisma'

export type NotificationType =
  | 'INCIDENT_SUBMITTED'
  | 'INCIDENT_AMBULANCE'
  | 'AIR_QUALITY_WARNING'
  | 'AIR_QUALITY_EVACUATION'
  | 'SCHEDULE_PUBLISHED'
  | 'SHIFT_OPEN'
  | 'SHIFT_EMERGENCY'
  | 'REPORT_REMINDER'
  | 'SYSTEM'

interface NotificationPayload {
  facilityId: string
  recipientUserId?: string
  recipientRoleId?: string
  type: NotificationType
  title: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
  sendEmail?: boolean
  sendSMS?: boolean
}

interface SMSPayload {
  facilityId: string
  userId?: string
  phoneNumber: string
  messageType: NotificationType
  messageBody: string
}

/**
 * Creates an in-app notification
 */
export async function createNotification(payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      facilityId: payload.facilityId,
      recipientUserId: payload.recipientUserId,
      recipientRoleId: payload.recipientRoleId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId
    }
  })

  // If SMS requested, queue it
  if (payload.sendSMS && payload.recipientUserId) {
    await queueSMSNotification(payload)
  }

  // If email requested, queue it
  if (payload.sendEmail && payload.recipientUserId) {
    await queueEmailNotification(payload)
  }

  return notification
}

/**
 * Queues an SMS notification for sending
 */
async function queueSMSNotification(payload: NotificationPayload) {
  if (!payload.recipientUserId) return

  // Get user's phone number and preferences
  const user = await prisma.user.findUnique({
    where: { id: payload.recipientUserId },
    select: {
      phone: true,
      phoneVerified: true,
      smsOptIn: true,
      smsPreference: true
    }
  })

  if (!user?.phone || !user.phoneVerified || !user.smsOptIn) {
    console.log('SMS skipped: user not opted in or phone not verified')
    return
  }

  // Check SMS preference
  const criticalTypes: NotificationType[] = [
    'INCIDENT_AMBULANCE',
    'AIR_QUALITY_EVACUATION',
    'SHIFT_EMERGENCY'
  ]

  if (user.smsPreference === 'NONE') {
    return
  }

  if (user.smsPreference === 'CRITICAL_ONLY' && !criticalTypes.includes(payload.type)) {
    return
  }

  // Check quiet hours
  const shouldSend = await checkQuietHours(payload.facilityId, criticalTypes.includes(payload.type))

  if (!shouldSend) {
    console.log('SMS skipped: quiet hours active')
    return
  }

  // Log the SMS (actual sending would happen here with Twilio)
  await prisma.sMSLog.create({
    data: {
      facilityId: payload.facilityId,
      userId: payload.recipientUserId,
      phoneNumber: user.phone,
      messageType: payload.type,
      messageBody: payload.message,
      status: 'QUEUED'
    }
  })

  // TODO: Integrate with Twilio to actually send
  // await sendTwilioSMS(user.phone, payload.message)
}

/**
 * Queues an email notification for sending
 */
async function queueEmailNotification(payload: NotificationPayload) {
  if (!payload.recipientUserId) return

  // Get user's email
  const user = await prisma.user.findUnique({
    where: { id: payload.recipientUserId },
    select: { email: true }
  })

  if (!user?.email) return

  // TODO: Integrate with email service (SendGrid, SES, etc.)
  console.log(`Email queued for ${user.email}: ${payload.title}`)
}

/**
 * Checks if we're in quiet hours
 */
async function checkQuietHours(facilityId: string, isCritical: boolean): Promise<boolean> {
  const settings = await prisma.facilitySettings.findUnique({
    where: { facilityId },
    select: {
      smsQuietHoursStart: true,
      smsQuietHoursEnd: true,
      smsCriticalOverride: true
    }
  })

  if (!settings?.smsQuietHoursStart || !settings?.smsQuietHoursEnd) {
    return true // No quiet hours configured
  }

  // Critical messages override quiet hours if enabled
  if (isCritical && settings.smsCriticalOverride) {
    return true
  }

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const isInQuietHours =
    currentTime >= settings.smsQuietHoursStart ||
    currentTime < settings.smsQuietHoursEnd

  return !isInQuietHours
}

// ==================== SCHEDULE NOTIFICATIONS ====================

/**
 * Notifies users when a schedule is published
 */
export async function notifySchedulePublished(
  facilityId: string,
  startDate: string,
  endDate: string
) {
  // Get all active users in the facility
  const users = await prisma.user.findMany({
    where: {
      facilityId,
      isActive: true
    },
    select: { id: true }
  })

  // Create notifications for each user
  for (const user of users) {
    await createNotification({
      facilityId,
      recipientUserId: user.id,
      type: 'SCHEDULE_PUBLISHED',
      title: 'Schedule Published',
      message: `The schedule for ${startDate} to ${endDate} has been published. Check your upcoming shifts.`,
      sendEmail: true
    })
  }

  return users.length
}

/**
 * Notifies users about an open shift
 */
export async function notifyOpenShift(
  facilityId: string,
  entryId: string,
  date: string,
  startTime: string,
  endTime: string,
  isEmergency: boolean
) {
  // Get all active users who can view schedules
  const users = await prisma.user.findMany({
    where: {
      facilityId,
      isActive: true
    },
    include: {
      role: true
    }
  })

  const notificationType: NotificationType = isEmergency ? 'SHIFT_EMERGENCY' : 'SHIFT_OPEN'
  const title = isEmergency ? 'Emergency Coverage Needed!' : 'Open Shift Available'
  const message = isEmergency
    ? `URGENT: Emergency coverage needed on ${date} from ${startTime} to ${endTime}. Please claim if available.`
    : `An open shift is available on ${date} from ${startTime} to ${endTime}.`

  // Notify users
  for (const user of users) {
    const permissions = (user.role.permissions as any)?.schedule
    if (!permissions?.access) continue

    await createNotification({
      facilityId,
      recipientUserId: user.id,
      type: notificationType,
      title,
      message,
      relatedEntityType: 'ScheduleEntry',
      relatedEntityId: entryId,
      sendSMS: isEmergency, // SMS for emergencies
      sendEmail: true
    })
  }
}

/**
 * Notifies a user when they've been assigned to a shift
 */
export async function notifyShiftAssignment(
  facilityId: string,
  userId: string,
  entryId: string,
  date: string,
  startTime: string,
  endTime: string,
  shiftName?: string
) {
  await createNotification({
    facilityId,
    recipientUserId: userId,
    type: 'SCHEDULE_PUBLISHED',
    title: 'Shift Assigned',
    message: `You have been assigned to ${shiftName || 'a shift'} on ${date} from ${startTime} to ${endTime}.`,
    relatedEntityType: 'ScheduleEntry',
    relatedEntityId: entryId,
    sendEmail: true
  })
}

/**
 * Notifies a user when their shift has been changed
 */
export async function notifyShiftChange(
  facilityId: string,
  userId: string,
  entryId: string,
  changeDescription: string
) {
  await createNotification({
    facilityId,
    recipientUserId: userId,
    type: 'SCHEDULE_PUBLISHED',
    title: 'Shift Updated',
    message: changeDescription,
    relatedEntityType: 'ScheduleEntry',
    relatedEntityId: entryId,
    sendEmail: true
  })
}

/**
 * Notifies a user when their shift has been cancelled
 */
export async function notifyShiftCancellation(
  facilityId: string,
  userId: string,
  date: string,
  startTime: string,
  reason?: string
) {
  await createNotification({
    facilityId,
    recipientUserId: userId,
    type: 'SCHEDULE_PUBLISHED',
    title: 'Shift Cancelled',
    message: `Your shift on ${date} at ${startTime} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    sendEmail: true,
    sendSMS: true
  })
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Gets unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      recipientUserId: userId,
      isRead: false
    },
    orderBy: { sentAt: 'desc' },
    take: 50
  })
}

/**
 * Marks a notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      recipientUserId: userId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })
}
