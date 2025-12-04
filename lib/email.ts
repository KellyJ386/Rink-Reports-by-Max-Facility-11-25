// Email Service
// Integration with Resend for email notifications

import {
  EmailMessage,
  EmailSendResult,
  EmailConfig,
} from '@/types/notifications'

// ============================================
// EMAIL CONFIGURATION
// ============================================

const emailConfig: EmailConfig = {
  from: process.env.EMAIL_FROM || 'MFO Ice Rink <noreply@rink.mfo.com>',
  replyTo: process.env.EMAIL_REPLY_TO,
  provider: 'resend',
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const baseEmailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e5e5;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      margin-bottom: 24px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 16px;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .alert-warning {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .alert-critical {
      background-color: #fee2e2;
      border: 1px solid #ef4444;
      color: #991b1b;
      padding: 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .alert-success {
      background-color: #d1fae5;
      border: 1px solid #10b981;
      color: #065f46;
      padding: 16px;
      border-radius: 6px;
      margin: 16px 0;
    }
    h2 {
      color: #1f2937;
      margin-bottom: 16px;
    }
    p {
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: 600;
      min-width: 120px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MFO Ice Rink</div>
    </div>
    <div class="content">
      {{content}}
    </div>
    {{#if actionUrl}}
    <div style="text-align: center;">
      <a href="{{actionUrl}}" class="button">{{actionLabel}}</a>
    </div>
    {{/if}}
    <div class="footer">
      <p>This is an automated message from MFO Ice Rink Management System.</p>
      <p>If you have questions, please contact your facility administrator.</p>
      <p>&copy; {{year}} MFO Ice Rink. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

// ============================================
// EMAIL SERVICE
// ============================================

/**
 * Send an email using Resend
 */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const resendApiKey = process.env.RESEND_API_KEY

  // If no API key, log and simulate success (for development)
  if (!resendApiKey) {
    console.log('[Email Service] No RESEND_API_KEY configured. Email would be sent:')
    console.log(`  To: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`)
    console.log(`  Subject: ${message.subject}`)
    console.log(`  Preview: ${message.text?.substring(0, 100) || 'HTML email'}...`)

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from || emailConfig.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo || emailConfig.replyTo,
        cc: message.cc,
        bcc: message.bcc,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          type: a.contentType,
        })),
        tags: message.tags
          ? Object.entries(message.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Email Service] Failed to send:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    const result = await response.json()
    console.log('[Email Service] Email sent successfully:', result.id)

    return {
      success: true,
      messageId: result.id,
    }
  } catch (error) {
    console.error('[Email Service] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email using a template
 */
export async function sendTemplateEmail(
  to: string | string[],
  subject: string,
  content: string,
  options: {
    actionUrl?: string
    actionLabel?: string
    alertType?: 'warning' | 'critical' | 'success'
  } = {}
): Promise<EmailSendResult> {
  let htmlContent = content

  // Wrap content in alert box if specified
  if (options.alertType) {
    htmlContent = `<div class="alert-${options.alertType}">${content}</div>`
  }

  // Build full HTML
  let html = baseEmailTemplate
    .replace('{{content}}', htmlContent)
    .replace('{{year}}', new Date().getFullYear().toString())

  // Handle action button
  if (options.actionUrl && options.actionLabel) {
    html = html
      .replace('{{#if actionUrl}}', '')
      .replace('{{/if}}', '')
      .replace('{{actionUrl}}', options.actionUrl)
      .replace('{{actionLabel}}', options.actionLabel)
  } else {
    // Remove action button block
    html = html.replace(/\{\{#if actionUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '')
  }

  return sendEmail({
    to,
    subject,
    html,
    text: content.replace(/<[^>]*>/g, ''), // Strip HTML for plain text version
  })
}

// ============================================
// SPECIFIC EMAIL FUNCTIONS
// ============================================

/**
 * Send incident notification email
 */
export async function sendIncidentEmail(
  to: string,
  data: {
    facilityName: string
    submittedBy: string
    date: string
    incidentId: string
    description?: string
  }
): Promise<EmailSendResult> {
  const content = `
    <h2>New Incident Report Submitted</h2>
    <div class="info-row">
      <span class="info-label">Facility:</span>
      <span>${data.facilityName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Submitted by:</span>
      <span>${data.submittedBy}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Date:</span>
      <span>${data.date}</span>
    </div>
    ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
    <p>Please review this incident report at your earliest convenience.</p>
  `

  return sendTemplateEmail(to, `New Incident Report - ${data.facilityName}`, content, {
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/incidents/${data.incidentId}`,
    actionLabel: 'View Incident',
  })
}

/**
 * Send shift assignment email
 */
export async function sendShiftAssignmentEmail(
  to: string,
  data: {
    employeeName: string
    shiftName: string
    shiftDate: string
    shiftTime: string
    facilityName: string
  }
): Promise<EmailSendResult> {
  const content = `
    <h2>New Shift Assignment</h2>
    <p>Hello ${data.employeeName},</p>
    <p>You have been assigned to a new shift:</p>
    <div class="info-row">
      <span class="info-label">Shift:</span>
      <span>${data.shiftName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Date:</span>
      <span>${data.shiftDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Time:</span>
      <span>${data.shiftTime}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Location:</span>
      <span>${data.facilityName}</span>
    </div>
    <p>Please confirm your availability in the scheduling system.</p>
  `

  return sendTemplateEmail(to, `New Shift Assignment - ${data.shiftDate}`, content, {
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/schedule/my-schedule`,
    actionLabel: 'View Schedule',
  })
}

/**
 * Send air quality alert email
 */
export async function sendAirQualityAlertEmail(
  to: string | string[],
  data: {
    level: 'warning' | 'critical' | 'evacuation'
    gasType: string
    currentLevel: number
    threshold: number
    facilityName: string
    rinkName?: string
  }
): Promise<EmailSendResult> {
  const levelEmoji = {
    warning: '⚠️',
    critical: '🚨',
    evacuation: '🚨🚨',
  }

  const levelTitle = {
    warning: 'Air Quality Warning',
    critical: 'CRITICAL Air Quality Alert',
    evacuation: 'EVACUATION REQUIRED',
  }

  const content = `
    <h2 style="${data.level === 'evacuation' ? 'color: #ef4444; font-size: 24px;' : ''}">${levelEmoji[data.level]} ${levelTitle[data.level]}</h2>
    <div class="info-row">
      <span class="info-label">Facility:</span>
      <span>${data.facilityName}</span>
    </div>
    ${data.rinkName ? `
    <div class="info-row">
      <span class="info-label">Rink:</span>
      <span>${data.rinkName}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">${data.gasType} Level:</span>
      <span style="font-weight: bold; color: ${data.level === 'warning' ? '#f59e0b' : '#ef4444'};">${data.currentLevel} ppm</span>
    </div>
    <div class="info-row">
      <span class="info-label">Threshold:</span>
      <span>${data.threshold} ppm</span>
    </div>
    ${data.level === 'evacuation' ? `
    <p style="color: #ef4444; font-size: 18px; font-weight: bold; margin-top: 16px;">
      EVACUATE THE FACILITY IMMEDIATELY
    </p>
    ` : `
    <p>Please monitor conditions and take appropriate action.</p>
    `}
  `

  return sendTemplateEmail(
    to,
    `${levelEmoji[data.level]} ${levelTitle[data.level]} - ${data.facilityName}`,
    content,
    {
      alertType: data.level === 'warning' ? 'warning' : 'critical',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/air-quality`,
      actionLabel: 'View Details',
    }
  )
}

/**
 * Send schedule published email
 */
export async function sendSchedulePublishedEmail(
  to: string,
  data: {
    employeeName: string
    schedulePeriod: string
    shiftCount: number
    shifts: Array<{
      date: string
      time: string
      name: string
    }>
  }
): Promise<EmailSendResult> {
  const shiftsHtml = data.shifts
    .map(
      (s) => `
      <div style="padding: 8px 0; border-bottom: 1px solid #e5e5e5;">
        <strong>${s.date}</strong> - ${s.time}<br>
        <span style="color: #666;">${s.name}</span>
      </div>
    `
    )
    .join('')

  const content = `
    <h2>Schedule Published</h2>
    <p>Hello ${data.employeeName},</p>
    <p>The schedule for <strong>${data.schedulePeriod}</strong> has been published.</p>
    <p>You have <strong>${data.shiftCount}</strong> shift${data.shiftCount !== 1 ? 's' : ''} scheduled:</p>
    <div style="margin: 16px 0; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px;">
      ${shiftsHtml || '<p style="color: #666;">No shifts assigned</p>'}
    </div>
    <p>Please review your schedule and confirm your shifts.</p>
  `

  return sendTemplateEmail(to, `New Schedule Published - ${data.schedulePeriod}`, content, {
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/schedule/my-schedule`,
    actionLabel: 'View My Schedule',
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: {
    userName: string
    resetLink: string
    expiresIn: string
  }
): Promise<EmailSendResult> {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${data.userName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="color: #666; font-size: 14px;">This link will expire in ${data.expiresIn}.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
  `

  return sendTemplateEmail(to, 'Password Reset Request', content, {
    actionUrl: data.resetLink,
    actionLabel: 'Reset Password',
  })
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  data: {
    userName: string
    facilityName: string
    loginLink: string
  }
): Promise<EmailSendResult> {
  const content = `
    <h2>Welcome to MFO Ice Rink!</h2>
    <p>Hello ${data.userName},</p>
    <p>Your account has been created for <strong>${data.facilityName}</strong>.</p>
    <p>You can now log in to access the ice rink management system, where you can:</p>
    <ul>
      <li>View and manage your schedule</li>
      <li>Submit reports and incidents</li>
      <li>Track ice depth and air quality</li>
      <li>And much more!</li>
    </ul>
    <p>If you have any questions, please contact your facility administrator.</p>
  `

  return sendTemplateEmail(to, `Welcome to ${data.facilityName}`, content, {
    actionUrl: data.loginLink,
    actionLabel: 'Log In Now',
  })
}

export { emailConfig }
