// Email service for sending notifications
// Supports multiple providers via environment variables

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// Email provider configuration from environment
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console' // 'console', 'resend', 'sendgrid'
const EMAIL_API_KEY = process.env.EMAIL_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@mfo.app'

async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  if (!EMAIL_API_KEY) {
    return { success: false, error: 'Resend API key not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  if (!EMAIL_API_KEY) {
    return { success: false, error: 'SendGrid API key not configured' }
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: (Array.isArray(options.to) ? options.to : [options.to]).map(email => ({ email }))
        }],
        from: { email: EMAIL_FROM },
        subject: options.subject,
        content: [
          { type: 'text/plain', value: options.text || options.html.replace(/<[^>]*>/g, '') },
          { type: 'text/html', value: options.html }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true, messageId: response.headers.get('x-message-id') || undefined }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

function sendToConsole(options: EmailOptions): EmailResult {
  console.log('\n========== EMAIL ==========')
  console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)
  console.log(`Subject: ${options.subject}`)
  console.log(`Body: ${options.text || options.html.replace(/<[^>]*>/g, '')}`)
  console.log('============================\n')
  return { success: true, messageId: `console-${Date.now()}` }
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  switch (EMAIL_PROVIDER) {
    case 'resend':
      return sendWithResend(options)
    case 'sendgrid':
      return sendWithSendGrid(options)
    case 'console':
    default:
      return sendToConsole(options)
  }
}

// Email templates for different notification types
export function getEmailTemplate(type: string, data: Record<string, string>): { subject: string; html: string; text: string } {
  const templates: Record<string, { subject: string; html: string; text: string }> = {
    INCIDENT_SUBMITTED: {
      subject: `New Incident Report - ${data.facilityName}`,
      html: `
        <h2>New Incident Report</h2>
        <p><strong>Facility:</strong> ${data.facilityName}</p>
        <p><strong>Rink:</strong> ${data.rinkName}</p>
        <p><strong>Type:</strong> ${data.incidentType}</p>
        <p><strong>Reported by:</strong> ${data.reporterName}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p>${data.message}</p>
        <p><a href="${data.link}">View Incident</a></p>
      `,
      text: `New Incident Report at ${data.facilityName}\n\nRink: ${data.rinkName}\nType: ${data.incidentType}\nReported by: ${data.reporterName}\nTime: ${data.time}\n\n${data.message}`
    },
    INCIDENT_AMBULANCE: {
      subject: `URGENT: Ambulance Called - ${data.facilityName}`,
      html: `
        <h2 style="color: red;">AMBULANCE CALLED</h2>
        <p><strong>Facility:</strong> ${data.facilityName}</p>
        <p><strong>Rink:</strong> ${data.rinkName}</p>
        <p><strong>Reported by:</strong> ${data.reporterName}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p>${data.message}</p>
        <p><a href="${data.link}">View Incident</a></p>
      `,
      text: `URGENT: AMBULANCE CALLED at ${data.facilityName}\n\nRink: ${data.rinkName}\nReported by: ${data.reporterName}\nTime: ${data.time}\n\n${data.message}`
    },
    AIR_QUALITY_WARNING: {
      subject: `Air Quality Warning - ${data.facilityName}`,
      html: `
        <h2 style="color: orange;">Air Quality Warning</h2>
        <p><strong>Facility:</strong> ${data.facilityName}</p>
        <p><strong>Rink:</strong> ${data.rinkName}</p>
        <p>${data.message}</p>
        <p><a href="${data.link}">View Details</a></p>
      `,
      text: `Air Quality Warning at ${data.facilityName}\n\nRink: ${data.rinkName}\n\n${data.message}`
    },
    AIR_QUALITY_EVACUATION: {
      subject: `EVACUATION REQUIRED - ${data.facilityName}`,
      html: `
        <h2 style="color: red;">EVACUATION REQUIRED</h2>
        <p><strong>Facility:</strong> ${data.facilityName}</p>
        <p><strong>Rink:</strong> ${data.rinkName}</p>
        <p>${data.message}</p>
        <p style="font-size: 18px; font-weight: bold;">EVACUATE IMMEDIATELY</p>
      `,
      text: `EVACUATION REQUIRED at ${data.facilityName}\n\nRink: ${data.rinkName}\n\n${data.message}\n\nEVACUATE IMMEDIATELY`
    },
    REFRIGERATION_WARNING: {
      subject: `Refrigeration Warning - ${data.facilityName}`,
      html: `
        <h2 style="color: orange;">Refrigeration Warning</h2>
        <p><strong>Facility:</strong> ${data.facilityName}</p>
        <p><strong>Rink:</strong> ${data.rinkName}</p>
        <p>${data.message}</p>
        <p><a href="${data.link}">View Details</a></p>
      `,
      text: `Refrigeration Warning at ${data.facilityName}\n\nRink: ${data.rinkName}\n\n${data.message}`
    },
    REFRIGERATION_CRITICAL: {
      subject: `REFRIGERATION CRITICAL - ${data.facilityName}`,
      html: `
        <h2 style="color: red;">REFRIGERATION CRITICAL ALERT</h2>
        <p><strong>Facility:</strong> ${data.facilityName}</p>
        <p><strong>Rink:</strong> ${data.rinkName}</p>
        <p>${data.message}</p>
        <p><a href="${data.link}">View Details</a></p>
      `,
      text: `REFRIGERATION CRITICAL at ${data.facilityName}\n\nRink: ${data.rinkName}\n\n${data.message}`
    },
    TIME_OFF_REQUEST: {
      subject: `Time Off Request - ${data.employeeName}`,
      html: `
        <h2>Time Off Request</h2>
        <p><strong>Employee:</strong> ${data.employeeName}</p>
        <p><strong>Dates:</strong> ${data.startDate} - ${data.endDate}</p>
        <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
        <p><a href="${data.link}">Review Request</a></p>
      `,
      text: `Time Off Request from ${data.employeeName}\n\nDates: ${data.startDate} - ${data.endDate}\nReason: ${data.reason || 'Not specified'}`
    },
    TIME_OFF_APPROVED: {
      subject: `Time Off Approved - ${data.startDate} to ${data.endDate}`,
      html: `
        <h2 style="color: green;">Time Off Approved</h2>
        <p>Your time off request has been approved.</p>
        <p><strong>Dates:</strong> ${data.startDate} - ${data.endDate}</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      `,
      text: `Your time off request has been approved.\n\nDates: ${data.startDate} - ${data.endDate}${data.notes ? `\nNotes: ${data.notes}` : ''}`
    },
    TIME_OFF_DENIED: {
      subject: `Time Off Request Denied`,
      html: `
        <h2 style="color: red;">Time Off Request Denied</h2>
        <p>Your time off request has been denied.</p>
        <p><strong>Dates:</strong> ${data.startDate} - ${data.endDate}</p>
        ${data.notes ? `<p><strong>Reason:</strong> ${data.notes}</p>` : ''}
      `,
      text: `Your time off request has been denied.\n\nDates: ${data.startDate} - ${data.endDate}${data.notes ? `\nReason: ${data.notes}` : ''}`
    },
    SCHEDULE_PUBLISHED: {
      subject: `Schedule Published - ${data.weekOf}`,
      html: `
        <h2>Schedule Published</h2>
        <p>The schedule for the week of ${data.weekOf} has been published.</p>
        <p><a href="${data.link}">View Your Schedule</a></p>
      `,
      text: `The schedule for the week of ${data.weekOf} has been published.`
    },
    SHIFT_OPEN: {
      subject: `Open Shift Available - ${data.date}`,
      html: `
        <h2>Open Shift Available</h2>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
        <p><strong>Rink:</strong> ${data.rinkName || 'Any'}</p>
        <p><a href="${data.link}">Claim This Shift</a></p>
      `,
      text: `Open Shift Available\n\nDate: ${data.date}\nTime: ${data.startTime} - ${data.endTime}\nRink: ${data.rinkName || 'Any'}`
    },
    DEFAULT: {
      subject: data.title || 'Notification',
      html: `
        <h2>${data.title || 'Notification'}</h2>
        <p>${data.message}</p>
      `,
      text: `${data.title || 'Notification'}\n\n${data.message}`
    }
  }

  return templates[type] || templates.DEFAULT
}
