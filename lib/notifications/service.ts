/**
 * Notification Service
 * Handles creating, sending, and managing notifications
 */

export type NotificationType =
  | 'INCIDENT_SUBMITTED'
  | 'INCIDENT_AMBULANCE'
  | 'AIR_QUALITY_WARNING'
  | 'AIR_QUALITY_EVACUATION'
  | 'SCHEDULE_PUBLISHED'
  | 'SHIFT_OPEN'
  | 'SHIFT_EMERGENCY'
  | 'REPORT_REMINDER'
  | 'SUBMISSION_REVIEWED'
  | 'SUBMISSION_APPROVED'
  | 'SUBMISSION_REJECTED'
  | 'SYSTEM'

export interface NotificationPayload {
  type: NotificationType
  facilityId: string
  recipientUserId?: string
  recipientRoleId?: string
  title: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  sendEmail?: boolean
  sendSms?: boolean
}

export interface NotificationResult {
  success: boolean
  notificationId?: string
  emailSent?: boolean
  smsSent?: boolean
  error?: string
}

/**
 * Create and send a notification
 * In production, this would:
 * 1. Create notification record in database
 * 2. Check user preferences
 * 3. Send email via SendGrid/Resend
 * 4. Send SMS via Twilio if enabled and appropriate
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  try {
    // In production, create notification in database
    const notificationId = `notif-${Date.now()}`

    // Check if email should be sent
    let emailSent = false
    if (payload.sendEmail !== false) {
      emailSent = await sendEmailNotification(payload)
    }

    // Check if SMS should be sent (only for critical notifications)
    let smsSent = false
    if (payload.sendSms && isCriticalNotification(payload.type)) {
      smsSent = await sendSmsNotification(payload)
    }

    return {
      success: true,
      notificationId,
      emailSent,
      smsSent,
    }
  } catch (error) {
    console.error('Failed to send notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email notification
 * In production, use SendGrid, Resend, or similar
 */
async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // Generate email HTML from template
    const html = generateEmailHtml(payload)

    // In production:
    // await resend.emails.send({
    //   from: 'MFO <notifications@mfo.com>',
    //   to: recipientEmail,
    //   subject: payload.title,
    //   html,
    // })

    console.log(`[Email] Would send: ${payload.title} to recipient`)
    console.log(`[Email] HTML preview:\n${html.substring(0, 200)}...`)

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Send SMS notification
 * In production, use Twilio or similar
 */
async function sendSmsNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // In production:
    // await twilio.messages.create({
    //   body: `MFO Alert: ${payload.title} - ${payload.message}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: recipientPhone,
    // })

    console.log(`[SMS] Would send: ${payload.title}`)

    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}

/**
 * Check if notification type is critical (warrants SMS)
 */
function isCriticalNotification(type: NotificationType): boolean {
  const criticalTypes: NotificationType[] = [
    'INCIDENT_AMBULANCE',
    'AIR_QUALITY_EVACUATION',
    'SHIFT_EMERGENCY',
  ]
  return criticalTypes.includes(type)
}

/**
 * Generate email HTML from notification payload
 */
function generateEmailHtml(payload: NotificationPayload): string {
  const template = getEmailTemplate(payload.type)
  return template
    .replace('{{title}}', payload.title)
    .replace('{{message}}', payload.message)
    .replace('{{type}}', formatNotificationType(payload.type))
    .replace('{{date}}', new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }))
}

/**
 * Get email template for notification type
 */
function getEmailTemplate(type: NotificationType): string {
  const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: {{headerColor}}; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px 24px; }
    .content h2 { margin: 0 0 16px; font-size: 20px; color: #18181b; }
    .content p { margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #52525b; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: {{badgeColor}}; color: {{badgeTextColor}}; }
    .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .footer { padding: 24px; text-align: center; color: #71717a; font-size: 14px; border-top: 1px solid #e4e4e7; }
    .meta { font-size: 14px; color: #71717a; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e4e4e7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MFO Ice Rink Management</h1>
    </div>
    <div class="content">
      <span class="badge">{{type}}</span>
      <h2 style="margin-top: 16px;">{{title}}</h2>
      <p>{{message}}</p>
      <a href="https://app.mfo.com/dashboard" class="button">View in Dashboard</a>
      <div class="meta">
        <p>Sent on {{date}}</p>
      </div>
    </div>
    <div class="footer">
      <p>MFO Ice Rink Management System</p>
      <p>To manage your notification preferences, visit Settings in the app.</p>
    </div>
  </div>
</body>
</html>`

  // Customize colors based on notification type
  const colors = getNotificationColors(type)
  return baseTemplate
    .replace('{{headerColor}}', colors.header)
    .replace('{{badgeColor}}', colors.badge)
    .replace('{{badgeTextColor}}', colors.badgeText)
}

/**
 * Get colors for notification type
 */
function getNotificationColors(type: NotificationType): {
  header: string
  badge: string
  badgeText: string
} {
  switch (type) {
    case 'INCIDENT_AMBULANCE':
    case 'AIR_QUALITY_EVACUATION':
    case 'SHIFT_EMERGENCY':
      return { header: '#dc2626', badge: '#fee2e2', badgeText: '#991b1b' }
    case 'INCIDENT_SUBMITTED':
    case 'AIR_QUALITY_WARNING':
      return { header: '#f59e0b', badge: '#fef3c7', badgeText: '#92400e' }
    case 'SUBMISSION_APPROVED':
      return { header: '#16a34a', badge: '#dcfce7', badgeText: '#166534' }
    case 'SUBMISSION_REJECTED':
      return { header: '#dc2626', badge: '#fee2e2', badgeText: '#991b1b' }
    case 'SCHEDULE_PUBLISHED':
    case 'SHIFT_OPEN':
      return { header: '#2563eb', badge: '#dbeafe', badgeText: '#1e40af' }
    default:
      return { header: '#3b82f6', badge: '#e0e7ff', badgeText: '#3730a3' }
  }
}

/**
 * Format notification type for display
 */
function formatNotificationType(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    INCIDENT_SUBMITTED: 'New Incident',
    INCIDENT_AMBULANCE: 'EMERGENCY',
    AIR_QUALITY_WARNING: 'Air Quality Alert',
    AIR_QUALITY_EVACUATION: 'EVACUATION REQUIRED',
    SCHEDULE_PUBLISHED: 'Schedule Update',
    SHIFT_OPEN: 'Open Shift',
    SHIFT_EMERGENCY: 'Emergency Coverage',
    REPORT_REMINDER: 'Reminder',
    SUBMISSION_REVIEWED: 'Submission Update',
    SUBMISSION_APPROVED: 'Approved',
    SUBMISSION_REJECTED: 'Action Required',
    SYSTEM: 'System Notice',
  }
  return labels[type] || type
}

/**
 * Convenience functions for common notification types
 */
export async function notifySubmissionReviewed(
  facilityId: string,
  userId: string,
  submissionId: string,
  status: 'approved' | 'rejected',
  reviewNotes?: string
): Promise<NotificationResult> {
  const type = status === 'approved' ? 'SUBMISSION_APPROVED' : 'SUBMISSION_REJECTED'
  const title = status === 'approved'
    ? 'Your submission has been approved'
    : 'Your submission requires attention'
  const message = reviewNotes
    ? `Review notes: ${reviewNotes}`
    : status === 'approved'
    ? 'Your form submission has been reviewed and approved.'
    : 'Your form submission has been reviewed and requires changes.'

  return sendNotification({
    type,
    facilityId,
    recipientUserId: userId,
    title,
    message,
    relatedEntityType: 'Submission',
    relatedEntityId: submissionId,
    priority: status === 'rejected' ? 'high' : 'normal',
    sendEmail: true,
  })
}

export async function notifySchedulePublished(
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'SCHEDULE_PUBLISHED',
    facilityId,
    title: 'Schedule Published',
    message: `The schedule for ${startDate} to ${endDate} has been published. Check your upcoming shifts in the app.`,
    priority: 'normal',
    sendEmail: true,
  })
}

export async function notifyOpenShift(
  facilityId: string,
  date: string,
  time: string,
  rinkName: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'SHIFT_OPEN',
    facilityId,
    title: 'Open Shift Available',
    message: `An open shift is available on ${date} at ${time} for ${rinkName}. First come, first served!`,
    priority: 'normal',
    sendEmail: true,
  })
}

export async function notifyEmergencyShift(
  facilityId: string,
  date: string,
  time: string,
  rinkName: string
): Promise<NotificationResult> {
  return sendNotification({
    type: 'SHIFT_EMERGENCY',
    facilityId,
    title: 'URGENT: Emergency Coverage Needed',
    message: `Emergency coverage is needed on ${date} at ${time} for ${rinkName}. Please respond ASAP if available.`,
    priority: 'critical',
    sendEmail: true,
    sendSms: true,
  })
}
