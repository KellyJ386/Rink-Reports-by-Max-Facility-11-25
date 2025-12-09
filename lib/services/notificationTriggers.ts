import prisma from '@/lib/prisma'
import { createNotification } from './notificationService'

/**
 * Analyzes incident submissions and triggers appropriate notifications
 */
export async function triggerIncidentNotifications(submissionId: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        rink: {
          select: {
            facilityId: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        formTemplate: {
          select: {
            moduleType: true,
          },
        },
      },
    })

    if (!submission || submission.formTemplate.moduleType !== 'INCIDENT') {
      return
    }

    const formData = submission.data as any
    const incidentType = formData['incident_type'] || 'General'
    const severity = formData['severity'] || 'Minor'
    const location = formData['location'] || 'Unknown location'
    const description = formData['description'] || 'No description provided'
    const submitterName = submission.submittedBy
      ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`
      : 'Unknown user'

    // Ambulance required - Critical notification
    if (incidentType === 'Ambulance Required' || formData['ambulance_called'] === 'yes') {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'INCIDENT_AMBULANCE',
        title: '🚨 CRITICAL: Ambulance Called',
        message: `An ambulance has been called to ${location}. Incident reported by ${submitterName}. Severity: ${severity}. ${description}`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: true, // Critical - send SMS
      })
    }

    // Serious or Critical severity
    if (severity === 'Critical' || severity === 'Serious') {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'INCIDENT_SUBMITTED',
        title: `${severity} Incident Reported`,
        message: `A ${severity.toLowerCase()} incident has been reported at ${location}. Type: ${incidentType}. Reported by ${submitterName}. Immediate review required.`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: severity === 'Critical', // SMS only for critical
      })
    }

    // Injury incidents
    if (incidentType === 'Injury') {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'INCIDENT_SUBMITTED',
        title: 'Injury Incident Reported',
        message: `An injury incident has been reported at ${location}. Severity: ${severity}. Reported by ${submitterName}. ${description}`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: false,
      })
    }

    // Safety violations
    if (incidentType === 'Safety Violation') {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'INCIDENT_SUBMITTED',
        title: 'Safety Violation Reported',
        message: `A safety violation has been reported at ${location}. Reported by ${submitterName}. ${description}`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: false,
      })
    }

    console.log(`[TRIGGER] Incident notifications sent for submission ${submissionId}`)
  } catch (error) {
    console.error('Error triggering incident notifications:', error)
  }
}

/**
 * Analyzes air quality submissions and triggers appropriate notifications
 */
export async function triggerAirQualityNotifications(submissionId: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        facility: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!submission || submission.formTemplate.moduleType !== 'AIR_QUALITY') {
      return
    }

    const formData = submission.data as any
    const coLevel = parseFloat(formData['co_level'] || '0')
    const no2Level = parseFloat(formData['no2_level'] || '0')
    const location = formData['location'] || submission.rink.name
    const submitterName = submission.submittedBy
      ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`
      : 'Unknown user'

    // CO thresholds: Normal <9, Warning 9-35, Critical >35
    // NO2 thresholds: Normal <0.5, Warning 0.5-3, Critical >3

    // Critical CO levels - Evacuation required
    if (coLevel > 35) {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'AIR_QUALITY_EVACUATION',
        title: '🚨 CRITICAL: CO Levels Exceed Safe Limits - EVACUATE',
        message: `CRITICAL: CO levels at ${coLevel} PPM (safe limit: 35 PPM) detected at ${location}. EVACUATE IMMEDIATELY. Reported by ${submitterName}.`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: true, // Critical - send SMS
      })
    }

    // Critical NO2 levels - Evacuation required
    if (no2Level > 3) {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'AIR_QUALITY_EVACUATION',
        title: '🚨 CRITICAL: NO2 Levels Exceed Safe Limits - EVACUATE',
        message: `CRITICAL: NO2 levels at ${no2Level} PPM (safe limit: 3 PPM) detected at ${location}. EVACUATE IMMEDIATELY. Reported by ${submitterName}.`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: true, // Critical - send SMS
      })
    }

    // Warning CO levels
    if (coLevel >= 9 && coLevel <= 35) {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'AIR_QUALITY_WARNING',
        title: '⚠️ WARNING: Elevated CO Levels',
        message: `WARNING: CO levels at ${coLevel} PPM (warning threshold: 9 PPM) detected at ${location}. Monitor closely and take corrective action. Reported by ${submitterName}.`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: false,
      })
    }

    // Warning NO2 levels
    if (no2Level >= 0.5 && no2Level <= 3) {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'AIR_QUALITY_WARNING',
        title: '⚠️ WARNING: Elevated NO2 Levels',
        message: `WARNING: NO2 levels at ${no2Level} PPM (warning threshold: 0.5 PPM) detected at ${location}. Monitor closely and take corrective action. Reported by ${submitterName}.`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: false,
      })
    }

    console.log(`[TRIGGER] Air quality notifications sent for submission ${submissionId}`)
  } catch (error) {
    console.error('Error triggering air quality notifications:', error)
  }
}

/**
 * Triggers notifications for refrigeration system alarms
 */
export async function triggerRefrigerationNotifications(submissionId: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        facility: true,
        submittedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!submission || submission.formTemplate.moduleType !== 'REFRIGERATION') {
      return
    }

    const formData = submission.data as any
    const alarmsActive = formData['alarms_active'] === 'yes'
    const alarmDetails = formData['alarm_details'] || ''
    const location = submission.rink.name
    const submitterName = submission.submittedBy
      ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`
      : 'Unknown user'

    if (alarmsActive) {
      await createNotification({
        facilityId: submission.rink.facilityId,
        type: 'SYSTEM',
        title: '⚠️ Refrigeration System Alarm',
        message: `Refrigeration system alarm detected at ${location}. ${alarmDetails}. Reported by ${submitterName}. Immediate attention required.`,
        relatedEntityType: 'SUBMISSION',
        relatedEntityId: submissionId,
        sendEmail: true,
        sendSMS: false,
      })
    }

    console.log(`[TRIGGER] Refrigeration notifications sent for submission ${submissionId}`)
  } catch (error) {
    console.error('Error triggering refrigeration notifications:', error)
  }
}

/**
 * Main trigger function to be called when a submission is created/updated
 */
export async function triggerSubmissionNotifications(submissionId: string, moduleType: string) {
  try {
    switch (moduleType) {
      case 'INCIDENT':
        await triggerIncidentNotifications(submissionId)
        break
      case 'AIR_QUALITY':
        await triggerAirQualityNotifications(submissionId)
        break
      case 'REFRIGERATION':
        await triggerRefrigerationNotifications(submissionId)
        break
      default:
        console.log(`[TRIGGER] No automated notifications for module type: ${moduleType}`)
    }
  } catch (error) {
    console.error('Error in triggerSubmissionNotifications:', error)
  }
}
