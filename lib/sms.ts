// SMS Service
// Integration with Twilio for SMS notifications

import {
  SMSMessage,
  SMSSendResult,
  SMSConfig,
} from '@/types/notifications'

// ============================================
// SMS CONFIGURATION
// ============================================

const smsConfig: SMSConfig = {
  provider: 'twilio',
  fromNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
}

// ============================================
// SMS SERVICE
// ============================================

/**
 * Send an SMS using Twilio
 */
export async function sendSMS(message: SMSMessage): Promise<SMSSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = message.from || smsConfig.fromNumber

  // If no credentials, log and simulate success (for development)
  if (!accountSid || !authToken) {
    console.log('[SMS Service] No Twilio credentials configured. SMS would be sent:')
    console.log(`  To: ${message.to}`)
    console.log(`  From: ${fromNumber}`)
    console.log(`  Body: ${message.body}`)

    return {
      success: true,
      messageId: `dev-sms-${Date.now()}`,
      status: 'simulated',
    }
  }

  try {
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    // Build form data
    const formData = new URLSearchParams()
    formData.append('To', formatPhoneNumber(message.to))
    formData.append('From', fromNumber)
    formData.append('Body', message.body)

    // Add media URLs if present
    if (message.mediaUrl?.length) {
      message.mediaUrl.forEach((url) => {
        formData.append('MediaUrl', url)
      })
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[SMS Service] Failed to send:', result)
      return {
        success: false,
        error: result.message || 'Failed to send SMS',
        status: result.status,
      }
    }

    console.log('[SMS Service] SMS sent successfully:', result.sid)

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
    }
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  body: string
): Promise<SMSSendResult[]> {
  const results = await Promise.all(
    recipients.map((to) => sendSMS({ to, body }))
  )
  return results
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // If already has country code (11 digits for US)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  // If 10 digits, assume US and add country code
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // Return with + prefix if not already formatted
  return digits.startsWith('+') ? phone : `+${digits}`
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  // Must have at least 10 digits (US) or 11+ for international
  return digits.length >= 10 && digits.length <= 15
}

// ============================================
// SPECIFIC SMS FUNCTIONS
// ============================================

/**
 * Send air quality alert SMS
 */
export async function sendAirQualityAlertSMS(
  to: string,
  data: {
    level: 'warning' | 'critical' | 'evacuation'
    gasType: string
    currentLevel: number
    facilityName: string
  }
): Promise<SMSSendResult> {
  const emoji = {
    warning: '⚠️',
    critical: '🚨',
    evacuation: '🚨🚨',
  }

  const message = data.level === 'evacuation'
    ? `${emoji[data.level]} EVACUATE ${data.facilityName} NOW! ${data.gasType} at ${data.currentLevel} ppm`
    : `${emoji[data.level]} AIR QUALITY ${data.level.toUpperCase()}: ${data.gasType} at ${data.currentLevel} ppm at ${data.facilityName}`

  return sendSMS({ to, body: message })
}

/**
 * Send shift reminder SMS
 */
export async function sendShiftReminderSMS(
  to: string,
  data: {
    shiftName: string
    shiftTime: string
    facilityName: string
  }
): Promise<SMSSendResult> {
  const message = `Reminder: Your shift (${data.shiftName}) starts at ${data.shiftTime} at ${data.facilityName}`
  return sendSMS({ to, body: message })
}

/**
 * Send shift cancellation SMS
 */
export async function sendShiftCancellationSMS(
  to: string,
  data: {
    shiftDate: string
    shiftName: string
    reason?: string
  }
): Promise<SMSSendResult> {
  let message = `Your shift on ${data.shiftDate} (${data.shiftName}) has been cancelled.`
  if (data.reason) {
    message += ` Reason: ${data.reason}`
  }
  return sendSMS({ to, body: message })
}

/**
 * Send incident notification SMS
 */
export async function sendIncidentSMS(
  to: string,
  data: {
    facilityName: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }
): Promise<SMSSendResult> {
  const emoji = data.severity === 'critical' || data.severity === 'high' ? '🚨' : '⚠️'
  const message = `${emoji} New ${data.severity} incident reported at ${data.facilityName}. Check the app for details.`
  return sendSMS({ to, body: message })
}

/**
 * Send emergency notification SMS
 */
export async function sendEmergencySMS(
  to: string | string[],
  message: string
): Promise<SMSSendResult | SMSSendResult[]> {
  const body = `🚨 EMERGENCY: ${message}`

  if (Array.isArray(to)) {
    return sendBulkSMS(to, body)
  }

  return sendSMS({ to, body })
}

/**
 * Send open shift notification SMS
 */
export async function sendOpenShiftSMS(
  to: string,
  data: {
    shiftDate: string
    shiftTime: string
    facilityName: string
  }
): Promise<SMSSendResult> {
  const message = `Open shift available: ${data.shiftDate} at ${data.shiftTime} (${data.facilityName}). Claim in the app!`
  return sendSMS({ to, body: message })
}

/**
 * Send verification code SMS
 */
export async function sendVerificationCodeSMS(
  to: string,
  code: string
): Promise<SMSSendResult> {
  const message = `Your MFO Ice Rink verification code is: ${code}. This code expires in 10 minutes.`
  return sendSMS({ to, body: message })
}

// ============================================
// TWILIO WEBHOOK HANDLERS
// ============================================

export interface TwilioWebhookPayload {
  MessageSid: string
  AccountSid: string
  From: string
  To: string
  Body: string
  NumMedia?: string
  MediaUrl0?: string
  MediaContentType0?: string
}

export interface TwilioStatusCallback {
  MessageSid: string
  MessageStatus: 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed'
  ErrorCode?: string
  ErrorMessage?: string
}

/**
 * Handle incoming SMS webhook from Twilio
 */
export async function handleIncomingSMS(payload: TwilioWebhookPayload): Promise<string | null> {
  console.log('[SMS Service] Incoming SMS:', {
    from: payload.From,
    to: payload.To,
    body: payload.Body,
    messageId: payload.MessageSid,
  })

  // Parse the incoming message
  const body = payload.Body.toLowerCase().trim()

  // Handle common keywords
  switch (body) {
    case 'stop':
    case 'unsubscribe':
      // Handle opt-out
      console.log(`[SMS Service] Opt-out request from ${payload.From}`)
      return 'You have been unsubscribed from SMS notifications. Text START to resubscribe.'

    case 'start':
    case 'subscribe':
      // Handle opt-in
      console.log(`[SMS Service] Opt-in request from ${payload.From}`)
      return 'You have been subscribed to SMS notifications from MFO Ice Rink.'

    case 'help':
      return 'MFO Ice Rink SMS: Reply STOP to unsubscribe, START to subscribe. For support, contact your facility admin.'

    case 'yes':
    case 'confirm':
      // Could be confirmation for shift, etc.
      console.log(`[SMS Service] Confirmation from ${payload.From}`)
      return 'Thank you for confirming. Your response has been recorded.'

    case 'no':
    case 'decline':
      console.log(`[SMS Service] Decline from ${payload.From}`)
      return 'Your response has been recorded.'

    default:
      // Log unknown messages for manual review
      console.log(`[SMS Service] Unknown message from ${payload.From}: ${payload.Body}`)
      return null // Don't send auto-reply for unknown messages
  }
}

/**
 * Handle SMS delivery status callback from Twilio
 */
export function handleStatusCallback(payload: TwilioStatusCallback): void {
  console.log('[SMS Service] Status update:', {
    messageId: payload.MessageSid,
    status: payload.MessageStatus,
    errorCode: payload.ErrorCode,
    errorMessage: payload.ErrorMessage,
  })

  // Could update database with delivery status
  // Could trigger retry logic for failed messages
  // Could send alerts for critical message failures

  if (payload.MessageStatus === 'failed' || payload.MessageStatus === 'undelivered') {
    console.error(`[SMS Service] Message ${payload.MessageSid} failed: ${payload.ErrorMessage}`)
    // Could implement retry logic or alert administrators
  }
}

export { smsConfig }
