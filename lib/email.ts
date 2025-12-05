// Email templates and sending utilities
// This module provides email functionality for the notification system

import type { NotificationType } from '@prisma/client'

interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

// Email sending function (to be implemented with actual provider like SendGrid, SES, etc.)
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // In production, integrate with email provider here
  console.log('Sending email:', params.subject, 'to:', params.to)
  return true
}

// Email templates
export function getEmailTemplate(
  type: NotificationType,
  data: Record<string, unknown>
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'INCIDENT_SUBMITTED':
      return incidentSubmittedTemplate(data)
    case 'INCIDENT_AMBULANCE':
      return incidentAmbulanceTemplate(data)
    case 'AIR_QUALITY_WARNING':
      return airQualityWarningTemplate(data)
    case 'AIR_QUALITY_EVACUATION':
      return airQualityEvacuationTemplate(data)
    case 'SCHEDULE_PUBLISHED':
      return schedulePublishedTemplate(data)
    case 'SHIFT_OPEN':
      return shiftOpenTemplate(data)
    case 'SHIFT_EMERGENCY':
      return shiftEmergencyTemplate(data)
    case 'REPORT_REMINDER':
      return reportReminderTemplate(data)
    default:
      return defaultTemplate(data)
  }
}

function incidentSubmittedTemplate(data: Record<string, unknown>) {
  const { incidentType, location, submittedBy, facilityName } = data
  return {
    subject: `New Incident Report - ${incidentType}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">New Incident Report Submitted</h2>
        <p>A new incident report has been submitted and requires your attention.</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Facility</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${facilityName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Type</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${incidentType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Location</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Submitted By</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${submittedBy}</td>
          </tr>
        </table>
        <p><a href="#" style="background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Report</a></p>
      </div>
    `,
    text: `New Incident Report - ${incidentType}\n\nFacility: ${facilityName}\nType: ${incidentType}\nLocation: ${location}\nSubmitted By: ${submittedBy}`,
  }
}

function incidentAmbulanceTemplate(data: Record<string, unknown>) {
  const { location, facilityName, time } = data
  return {
    subject: `URGENT: Ambulance Called - ${facilityName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #dc2626; padding: 20px;">
        <h1 style="color: #dc2626; margin-top: 0;">🚨 AMBULANCE CALLED</h1>
        <p style="font-size: 18px;"><strong>An ambulance has been called to ${facilityName}.</strong></p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Location</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Time</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${time}</td>
          </tr>
        </table>
        <p>Please ensure emergency access routes are clear and be prepared to assist emergency personnel.</p>
      </div>
    `,
    text: `URGENT: AMBULANCE CALLED\n\nAn ambulance has been called to ${facilityName}.\nLocation: ${location}\nTime: ${time}`,
  }
}

function airQualityWarningTemplate(data: Record<string, unknown>) {
  const { gasType, reading, threshold, facilityName } = data
  return {
    subject: `Air Quality Warning - ${gasType} Elevated`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #f59e0b; padding: 20px;">
        <h2 style="color: #f59e0b;">⚠️ Air Quality Warning</h2>
        <p><strong>${gasType} levels are elevated at ${facilityName}.</strong></p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Current Reading</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${reading} ppm</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Warning Threshold</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${threshold} ppm</td>
          </tr>
        </table>
        <p>Monitor conditions closely and be prepared to evacuate if levels continue to rise.</p>
      </div>
    `,
    text: `Air Quality Warning - ${gasType}\n\nCurrent Reading: ${reading} ppm\nWarning Threshold: ${threshold} ppm`,
  }
}

function airQualityEvacuationTemplate(data: Record<string, unknown>) {
  const { gasType, reading, threshold, facilityName } = data
  return {
    subject: `EVACUATION REQUIRED - ${gasType} Critical at ${facilityName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #dc2626; padding: 20px; background: #fef2f2;">
        <h1 style="color: #dc2626; margin-top: 0;">🚨 EVACUATION REQUIRED</h1>
        <p style="font-size: 18px;"><strong>${gasType} levels have reached critical levels. Begin evacuation immediately.</strong></p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background: white;"><strong>Current Reading</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background: white; color: #dc2626; font-weight: bold;">${reading} ppm</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background: white;"><strong>Evacuation Threshold</strong></td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; background: white;">${threshold} ppm</td>
          </tr>
        </table>
        <p style="color: #dc2626; font-weight: bold;">Do not re-enter the facility until cleared by emergency personnel.</p>
      </div>
    `,
    text: `EVACUATION REQUIRED\n\n${gasType} levels have reached ${reading} ppm (threshold: ${threshold} ppm).\n\nBegin evacuation immediately.`,
  }
}

function schedulePublishedTemplate(data: Record<string, unknown>) {
  const { weekOf, facilityName } = data
  return {
    subject: `Schedule Published - Week of ${weekOf}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">📅 New Schedule Available</h2>
        <p>The schedule for the week of <strong>${weekOf}</strong> has been published for ${facilityName}.</p>
        <p><a href="#" style="background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Schedule</a></p>
      </div>
    `,
    text: `Schedule Published\n\nThe schedule for the week of ${weekOf} has been published.`,
  }
}

function shiftOpenTemplate(data: Record<string, unknown>) {
  const { date, time, facilityName } = data
  return {
    subject: `Open Shift Available - ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">📢 Open Shift Available</h2>
        <p>A shift is available at ${facilityName}:</p>
        <p><strong>Date:</strong> ${date}<br><strong>Time:</strong> ${time}</p>
        <p><a href="#" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Claim Shift</a></p>
      </div>
    `,
    text: `Open Shift Available\n\nDate: ${date}\nTime: ${time}`,
  }
}

function shiftEmergencyTemplate(data: Record<string, unknown>) {
  const { date, time, facilityName, reason } = data
  return {
    subject: `URGENT: Emergency Coverage Needed - ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #dc2626; padding: 20px;">
        <h2 style="color: #dc2626;">🆘 Emergency Coverage Needed</h2>
        <p><strong>Urgent coverage is needed at ${facilityName}.</strong></p>
        <p><strong>Date:</strong> ${date}<br><strong>Time:</strong> ${time}<br><strong>Reason:</strong> ${reason}</p>
        <p><a href="#" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Respond Now</a></p>
      </div>
    `,
    text: `EMERGENCY: Coverage Needed\n\nDate: ${date}\nTime: ${time}\nReason: ${reason}`,
  }
}

function reportReminderTemplate(data: Record<string, unknown>) {
  const { reportType, dueTime, facilityName } = data
  return {
    subject: `Reminder: ${reportType} Due`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6b7280;">⏰ Report Reminder</h2>
        <p>This is a reminder that your <strong>${reportType}</strong> is due by ${dueTime}.</p>
        <p><a href="#" style="background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Submit Report</a></p>
      </div>
    `,
    text: `Report Reminder\n\n${reportType} is due by ${dueTime}.`,
  }
}

function defaultTemplate(data: Record<string, unknown>) {
  const { title, message } = data
  return {
    subject: title as string || 'Notification',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    `,
    text: `${title}\n\n${message}`,
  }
}
