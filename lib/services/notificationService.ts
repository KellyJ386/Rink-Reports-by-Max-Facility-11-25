import prisma from '@/lib/prisma'

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

export interface NotificationOptions {
  facilityId: string
  type: NotificationType
  title: string
  message: string
  recipientUserId?: string | null
  recipientRoleId?: string | null
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  sendEmail?: boolean
  sendSMS?: boolean
}

/**
 * Creates a notification in the database
 *
 * @param options - Notification options
 * @returns The created notification
 */
export async function createNotification(options: NotificationOptions) {
  const {
    facilityId,
    type,
    title,
    message,
    recipientUserId = null,
    recipientRoleId = null,
    relatedEntityType = null,
    relatedEntityId = null,
    sendEmail = false,
    sendSMS = false,
  } = options

  try {
    const notification = await prisma.notification.create({
      data: {
        facilityId,
        type,
        title,
        message,
        recipientUserId,
        recipientRoleId,
        relatedEntityType,
        relatedEntityId,
        emailSent: sendEmail,
        emailSentAt: sendEmail ? new Date() : null,
      },
    })

    // Send email if requested
    if (sendEmail && recipientUserId) {
      await sendEmailNotification(notification.id, recipientUserId)
    }

    // Send SMS if requested
    if (sendSMS && recipientUserId) {
      await sendSMSNotification(notification.id, recipientUserId, type)
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Sends an email notification to a user
 *
 * @param notificationId - The notification ID
 * @param userId - The user ID to send to
 */
async function sendEmailNotification(notificationId: string, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true },
    })

    if (!user) {
      console.error(`User ${userId} not found for email notification`)
      return
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      console.error(`Notification ${notificationId} not found`)
      return
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // Example integration:
    // await emailService.send({
    //   to: user.email,
    //   subject: notification.title,
    //   html: generateEmailTemplate(notification, user),
    // })

    console.log(`[EMAIL] Would send to ${user.email}:`, {
      subject: notification.title,
      body: notification.message,
    })

    // Update notification record
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

/**
 * Sends an SMS notification to a user
 *
 * @param notificationId - The notification ID
 * @param userId - The user ID to send to
 * @param type - The notification type
 */
async function sendSMSNotification(
  notificationId: string,
  userId: string,
  type: NotificationType
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        phoneVerified: true,
        smsOptIn: true,
        smsPreference: true,
        facilityId: true,
      },
    })

    if (!user || !user.phone || !user.phoneVerified || !user.smsOptIn) {
      console.log(`User ${userId} not eligible for SMS notification`)
      return
    }

    // Check if user's SMS preference allows this type of notification
    const criticalTypes: NotificationType[] = [
      'INCIDENT_AMBULANCE',
      'AIR_QUALITY_EVACUATION',
      'SHIFT_EMERGENCY',
    ]

    if (user.smsPreference === 'NONE') {
      console.log(`User ${userId} has SMS disabled`)
      return
    }

    if (user.smsPreference === 'CRITICAL_ONLY' && !criticalTypes.includes(type)) {
      console.log(`User ${userId} only receives critical SMS, skipping ${type}`)
      return
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      console.error(`Notification ${notificationId} not found`)
      return
    }

    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // Example integration:
    // await smsService.send({
    //   to: user.phone,
    //   body: `${notification.title}\n\n${notification.message}`,
    // })

    console.log(`[SMS] Would send to ${user.phone}:`, {
      body: `${notification.title}\n\n${notification.message}`,
    })

    // Log SMS in database
    await prisma.sMSLog.create({
      data: {
        facilityId: user.facilityId,
        userId,
        phoneNumber: user.phone,
        messageType: type,
        messageBody: `${notification.title}\n\n${notification.message}`,
        status: 'SENT',
      },
    })
  } catch (error) {
    console.error('Error sending SMS notification:', error)

    // Log failed SMS
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true, facilityId: true },
      })

      if (user && user.phone) {
        await prisma.sMSLog.create({
          data: {
            facilityId: user.facilityId,
            userId,
            phoneNumber: user.phone,
            messageType: type,
            messageBody: 'Failed to send',
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    } catch (logError) {
      console.error('Error logging failed SMS:', logError)
    }
  }
}

/**
 * Notifies users when a schedule is published
 *
 * @param facilityId - The facility ID
 * @param scheduleDate - The schedule date
 * @param userIds - Array of user IDs affected by the schedule
 */
export async function notifySchedulePublished(
  facilityId: string,
  scheduleDate: Date,
  userIds: string[]
) {
  const dateStr = scheduleDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  for (const userId of userIds) {
    await createNotification({
      facilityId,
      type: 'SCHEDULE_PUBLISHED',
      title: 'New Schedule Published',
      message: `Your schedule for ${dateStr} has been published. Check your dashboard to view your shifts.`,
      recipientUserId: userId,
      sendEmail: true,
      sendSMS: true,
    })
  }
}

/**
 * Notifies users when an open shift is available
 *
 * @param facilityId - The facility ID
 * @param shiftDate - The shift date
 * @param shiftDetails - Shift details (time, location)
 */
export async function notifyOpenShift(
  facilityId: string,
  shiftDate: Date,
  shiftDetails: string
) {
  const dateStr = shiftDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  await createNotification({
    facilityId,
    type: 'SHIFT_OPEN',
    title: 'Open Shift Available',
    message: `An open shift is available on ${dateStr}. ${shiftDetails}. Claim it now on your dashboard.`,
    sendEmail: true,
    sendSMS: true,
  })
}

/**
 * Notifies users when an emergency shift needs coverage
 *
 * @param facilityId - The facility ID
 * @param shiftDate - The shift date
 * @param shiftDetails - Shift details (time, location)
 */
export async function notifyEmergencyShift(
  facilityId: string,
  shiftDate: Date,
  shiftDetails: string
) {
  const dateStr = shiftDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  await createNotification({
    facilityId,
    type: 'SHIFT_EMERGENCY',
    title: '🚨 Emergency Shift - Immediate Coverage Needed',
    message: `URGENT: Emergency coverage needed on ${dateStr}. ${shiftDetails}. Please claim this shift if you are available.`,
    sendEmail: true,
    sendSMS: true,
  })
}

/**
 * Sends a reminder notification before a shift
 *
 * @param userId - The user ID
 * @param facilityId - The facility ID
 * @param shiftDate - The shift date/time
 * @param shiftDetails - Shift details
 */
export async function sendShiftReminder(
  userId: string,
  facilityId: string,
  shiftDate: Date,
  shiftDetails: string
) {
  const dateStr = shiftDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const timeStr = shiftDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  await createNotification({
    facilityId,
    type: 'REPORT_REMINDER',
    title: 'Shift Reminder',
    message: `Reminder: You have a shift on ${dateStr} at ${timeStr}. ${shiftDetails}`,
    recipientUserId: userId,
    sendEmail: true,
    sendSMS: true,
  })
}

/**
 * Notifies users when a schedule change occurs
 *
 * @param userId - The user ID
 * @param facilityId - The facility ID
 * @param changeDetails - Details about what changed
 */
export async function notifyScheduleChange(
  userId: string,
  facilityId: string,
  changeDetails: string
) {
  await createNotification({
    facilityId,
    type: 'SYSTEM',
    title: 'Schedule Changed',
    message: `Your schedule has been updated. ${changeDetails}. Please review your updated schedule.`,
    recipientUserId: userId,
    sendEmail: true,
    sendSMS: true,
  })
}
