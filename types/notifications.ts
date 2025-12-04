// Notification Types and Interfaces
// Comprehensive type definitions for the notification system

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | 'INCIDENT_SUBMITTED'
  | 'INCIDENT_APPROVED'
  | 'INCIDENT_REJECTED'
  | 'SHIFT_ASSIGNED'
  | 'SHIFT_UPDATED'
  | 'SHIFT_CANCELLED'
  | 'SHIFT_SWAP_REQUESTED'
  | 'SHIFT_SWAP_APPROVED'
  | 'SHIFT_SWAP_REJECTED'
  | 'OPEN_SHIFT_AVAILABLE'
  | 'SCHEDULE_PUBLISHED'
  | 'AIR_QUALITY_WARNING'
  | 'AIR_QUALITY_CRITICAL'
  | 'AIR_QUALITY_EVACUATION'
  | 'SUBMISSION_REMINDER'
  | 'APPROVAL_REQUIRED'
  | 'REPORT_SUBMITTED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'CUSTOM'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DELETED'

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'

export type NotificationCategory =
  | 'SCHEDULE'
  | 'INCIDENTS'
  | 'AIR_QUALITY'
  | 'REPORTS'
  | 'SYSTEM'
  | 'ADMIN'

// ============================================
// NOTIFICATION INTERFACES
// ============================================

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  message: string
  data?: NotificationData
  recipientId: string
  recipientType: 'USER' | 'ROLE' | 'FACILITY' | 'BROADCAST'
  channels: NotificationChannel[]
  readAt?: string
  sentAt?: string
  expiresAt?: string
  actionUrl?: string
  actionLabel?: string
  imageUrl?: string
  groupId?: string // For grouping related notifications
  createdAt: string
  updatedAt: string
}

export interface NotificationData {
  entityType?: 'SHIFT' | 'INCIDENT' | 'REPORT' | 'SCHEDULE' | 'USER'
  entityId?: string
  entityName?: string
  submittedBy?: {
    id: string
    name: string
    avatar?: string
  }
  facilityId?: string
  facilityName?: string
  rinkId?: string
  rinkName?: string
  shiftDate?: string
  shiftTime?: string
  airQualityLevel?: number
  threshold?: number
  metadata?: Record<string, unknown>
}

export interface NotificationGroup {
  id: string
  type: NotificationType
  category: NotificationCategory
  count: number
  latestNotification: Notification
  notifications: Notification[]
  createdAt: string
  updatedAt: string
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  id: string
  userId: string

  // Channel preferences
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean

  // Category preferences
  categories: {
    [K in NotificationCategory]: {
      enabled: boolean
      channels: NotificationChannel[]
      priority: NotificationPriority // Minimum priority to notify
    }
  }

  // Type-specific overrides
  typeOverrides?: {
    [K in NotificationType]?: {
      enabled: boolean
      channels?: NotificationChannel[]
    }
  }

  // Quiet hours
  quietHoursEnabled: boolean
  quietHoursStart?: string // HH:mm format
  quietHoursEnd?: string // HH:mm format
  quietHoursExcludeUrgent: boolean // Allow urgent notifications during quiet hours

  // Digest settings
  emailDigestEnabled: boolean
  emailDigestFrequency: 'DAILY' | 'WEEKLY' | 'NEVER'
  emailDigestTime?: string // HH:mm format

  // Contact info
  emailAddress?: string
  phoneNumber?: string

  createdAt: string
  updatedAt: string
}

// Default preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,

  categories: {
    SCHEDULE: {
      enabled: true,
      channels: ['IN_APP', 'EMAIL'],
      priority: 'NORMAL',
    },
    INCIDENTS: {
      enabled: true,
      channels: ['IN_APP', 'EMAIL'],
      priority: 'NORMAL',
    },
    AIR_QUALITY: {
      enabled: true,
      channels: ['IN_APP', 'EMAIL', 'SMS'],
      priority: 'LOW',
    },
    REPORTS: {
      enabled: true,
      channels: ['IN_APP'],
      priority: 'NORMAL',
    },
    SYSTEM: {
      enabled: true,
      channels: ['IN_APP'],
      priority: 'NORMAL',
    },
    ADMIN: {
      enabled: true,
      channels: ['IN_APP', 'EMAIL'],
      priority: 'NORMAL',
    },
  },

  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  quietHoursExcludeUrgent: true,

  emailDigestEnabled: false,
  emailDigestFrequency: 'DAILY',
  emailDigestTime: '08:00',
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export interface NotificationTemplate {
  id: string
  type: NotificationType
  name: string
  category: NotificationCategory
  defaultPriority: NotificationPriority

  // Template content
  titleTemplate: string
  messageTemplate: string
  emailSubjectTemplate?: string
  emailBodyTemplate?: string
  smsTemplate?: string

  // Template variables
  variables: string[]

  // Defaults
  defaultChannels: NotificationChannel[]
  defaultActionUrl?: string
  defaultActionLabel?: string

  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Built-in templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>> = {
  INCIDENT_SUBMITTED: {
    type: 'INCIDENT_SUBMITTED',
    name: 'Incident Submitted',
    category: 'INCIDENTS',
    defaultPriority: 'HIGH',
    titleTemplate: 'New Incident Report',
    messageTemplate: '{{submittedBy}} submitted an incident report at {{facilityName}}',
    emailSubjectTemplate: 'New Incident Report - {{facilityName}}',
    emailBodyTemplate: `
      <h2>New Incident Report Submitted</h2>
      <p><strong>Facility:</strong> {{facilityName}}</p>
      <p><strong>Submitted by:</strong> {{submittedBy}}</p>
      <p><strong>Date:</strong> {{date}}</p>
      <p>Please review this incident report at your earliest convenience.</p>
    `,
    smsTemplate: 'New incident at {{facilityName}}. Review required.',
    variables: ['submittedBy', 'facilityName', 'date', 'incidentId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/incidents/{{incidentId}}',
    defaultActionLabel: 'View Incident',
    isSystem: true,
    isActive: true,
  },

  INCIDENT_APPROVED: {
    type: 'INCIDENT_APPROVED',
    name: 'Incident Approved',
    category: 'INCIDENTS',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Incident Report Approved',
    messageTemplate: 'Your incident report has been approved by {{approvedBy}}',
    emailSubjectTemplate: 'Incident Report Approved',
    emailBodyTemplate: `
      <h2>Incident Report Approved</h2>
      <p>Your incident report has been reviewed and approved.</p>
      <p><strong>Approved by:</strong> {{approvedBy}}</p>
    `,
    smsTemplate: 'Your incident report has been approved.',
    variables: ['approvedBy', 'incidentId'],
    defaultChannels: ['IN_APP'],
    defaultActionUrl: '/dashboard/incidents/{{incidentId}}',
    defaultActionLabel: 'View Details',
    isSystem: true,
    isActive: true,
  },

  INCIDENT_REJECTED: {
    type: 'INCIDENT_REJECTED',
    name: 'Incident Rejected',
    category: 'INCIDENTS',
    defaultPriority: 'HIGH',
    titleTemplate: 'Incident Report Needs Revision',
    messageTemplate: 'Your incident report was returned by {{rejectedBy}}: {{reason}}',
    emailSubjectTemplate: 'Incident Report Needs Revision',
    emailBodyTemplate: `
      <h2>Incident Report Needs Revision</h2>
      <p>Your incident report requires changes before approval.</p>
      <p><strong>Returned by:</strong> {{rejectedBy}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
    `,
    smsTemplate: 'Incident report needs revision. Check email for details.',
    variables: ['rejectedBy', 'reason', 'incidentId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/incidents/{{incidentId}}',
    defaultActionLabel: 'Revise Report',
    isSystem: true,
    isActive: true,
  },

  SHIFT_ASSIGNED: {
    type: 'SHIFT_ASSIGNED',
    name: 'Shift Assigned',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'New Shift Assignment',
    messageTemplate: 'You have been assigned to {{shiftName}} on {{shiftDate}}',
    emailSubjectTemplate: 'New Shift Assignment - {{shiftDate}}',
    emailBodyTemplate: `
      <h2>New Shift Assignment</h2>
      <p>You have been assigned to a new shift:</p>
      <p><strong>Shift:</strong> {{shiftName}}</p>
      <p><strong>Date:</strong> {{shiftDate}}</p>
      <p><strong>Time:</strong> {{shiftTime}}</p>
      <p><strong>Location:</strong> {{facilityName}}</p>
    `,
    smsTemplate: 'New shift: {{shiftName}} on {{shiftDate}} at {{shiftTime}}',
    variables: ['shiftName', 'shiftDate', 'shiftTime', 'facilityName', 'shiftId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/schedule/my-schedule',
    defaultActionLabel: 'View Schedule',
    isSystem: true,
    isActive: true,
  },

  SHIFT_UPDATED: {
    type: 'SHIFT_UPDATED',
    name: 'Shift Updated',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Shift Update',
    messageTemplate: 'Your shift on {{shiftDate}} has been updated',
    emailSubjectTemplate: 'Shift Update - {{shiftDate}}',
    emailBodyTemplate: `
      <h2>Shift Updated</h2>
      <p>Your shift has been updated:</p>
      <p><strong>Date:</strong> {{shiftDate}}</p>
      <p><strong>Changes:</strong> {{changes}}</p>
    `,
    smsTemplate: 'Shift update for {{shiftDate}}. Check your schedule.',
    variables: ['shiftDate', 'shiftTime', 'changes', 'shiftId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/schedule/my-schedule',
    defaultActionLabel: 'View Schedule',
    isSystem: true,
    isActive: true,
  },

  SHIFT_CANCELLED: {
    type: 'SHIFT_CANCELLED',
    name: 'Shift Cancelled',
    category: 'SCHEDULE',
    defaultPriority: 'HIGH',
    titleTemplate: 'Shift Cancelled',
    messageTemplate: 'Your shift on {{shiftDate}} has been cancelled',
    emailSubjectTemplate: 'Shift Cancelled - {{shiftDate}}',
    emailBodyTemplate: `
      <h2>Shift Cancelled</h2>
      <p>Your shift has been cancelled:</p>
      <p><strong>Shift:</strong> {{shiftName}}</p>
      <p><strong>Date:</strong> {{shiftDate}}</p>
      <p><strong>Reason:</strong> {{reason}}</p>
    `,
    smsTemplate: 'Shift cancelled: {{shiftDate}} - {{shiftName}}',
    variables: ['shiftName', 'shiftDate', 'reason', 'shiftId'],
    defaultChannels: ['IN_APP', 'EMAIL', 'SMS'],
    defaultActionUrl: '/dashboard/schedule/my-schedule',
    defaultActionLabel: 'View Schedule',
    isSystem: true,
    isActive: true,
  },

  SHIFT_SWAP_REQUESTED: {
    type: 'SHIFT_SWAP_REQUESTED',
    name: 'Shift Swap Request',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Shift Swap Request',
    messageTemplate: '{{requesterName}} wants to swap shifts with you',
    emailSubjectTemplate: 'Shift Swap Request from {{requesterName}}',
    emailBodyTemplate: `
      <h2>Shift Swap Request</h2>
      <p>{{requesterName}} has requested to swap shifts with you:</p>
      <p><strong>Their shift:</strong> {{theirShiftDate}} at {{theirShiftTime}}</p>
      <p><strong>Your shift:</strong> {{yourShiftDate}} at {{yourShiftTime}}</p>
    `,
    smsTemplate: '{{requesterName}} wants to swap shifts. Check your app.',
    variables: ['requesterName', 'theirShiftDate', 'theirShiftTime', 'yourShiftDate', 'yourShiftTime', 'requestId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/schedule/my-schedule?tab=swaps',
    defaultActionLabel: 'Review Request',
    isSystem: true,
    isActive: true,
  },

  SHIFT_SWAP_APPROVED: {
    type: 'SHIFT_SWAP_APPROVED',
    name: 'Shift Swap Approved',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Shift Swap Approved',
    messageTemplate: 'Your shift swap request has been approved',
    emailSubjectTemplate: 'Shift Swap Approved',
    emailBodyTemplate: `
      <h2>Shift Swap Approved</h2>
      <p>Your shift swap request has been approved.</p>
      <p>Your new shift: {{newShiftDate}} at {{newShiftTime}}</p>
    `,
    smsTemplate: 'Shift swap approved. New shift: {{newShiftDate}}',
    variables: ['newShiftDate', 'newShiftTime', 'requestId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/schedule/my-schedule',
    defaultActionLabel: 'View Schedule',
    isSystem: true,
    isActive: true,
  },

  SHIFT_SWAP_REJECTED: {
    type: 'SHIFT_SWAP_REJECTED',
    name: 'Shift Swap Rejected',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Shift Swap Declined',
    messageTemplate: 'Your shift swap request was declined',
    emailSubjectTemplate: 'Shift Swap Request Declined',
    emailBodyTemplate: `
      <h2>Shift Swap Declined</h2>
      <p>Your shift swap request was declined.</p>
      {{#if reason}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}
    `,
    smsTemplate: 'Shift swap request declined.',
    variables: ['reason', 'requestId'],
    defaultChannels: ['IN_APP'],
    defaultActionUrl: '/dashboard/schedule/my-schedule',
    defaultActionLabel: 'View Schedule',
    isSystem: true,
    isActive: true,
  },

  OPEN_SHIFT_AVAILABLE: {
    type: 'OPEN_SHIFT_AVAILABLE',
    name: 'Open Shift Available',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Open Shift Available',
    messageTemplate: 'An open shift is available on {{shiftDate}}',
    emailSubjectTemplate: 'Open Shift Available - {{shiftDate}}',
    emailBodyTemplate: `
      <h2>Open Shift Available</h2>
      <p>A shift is available that matches your availability:</p>
      <p><strong>Date:</strong> {{shiftDate}}</p>
      <p><strong>Time:</strong> {{shiftTime}}</p>
      <p><strong>Location:</strong> {{facilityName}}</p>
    `,
    smsTemplate: 'Open shift: {{shiftDate}} at {{shiftTime}}. Claim now!',
    variables: ['shiftDate', 'shiftTime', 'facilityName', 'shiftId'],
    defaultChannels: ['IN_APP'],
    defaultActionUrl: '/dashboard/schedule/my-schedule?tab=open-shifts',
    defaultActionLabel: 'Claim Shift',
    isSystem: true,
    isActive: true,
  },

  SCHEDULE_PUBLISHED: {
    type: 'SCHEDULE_PUBLISHED',
    name: 'Schedule Published',
    category: 'SCHEDULE',
    defaultPriority: 'NORMAL',
    titleTemplate: 'New Schedule Published',
    messageTemplate: 'The schedule for {{schedulePeriod}} has been published',
    emailSubjectTemplate: 'New Schedule Published - {{schedulePeriod}}',
    emailBodyTemplate: `
      <h2>Schedule Published</h2>
      <p>The schedule for {{schedulePeriod}} has been published.</p>
      <p>You have {{shiftCount}} shift(s) scheduled.</p>
    `,
    smsTemplate: 'Schedule published for {{schedulePeriod}}. Check your shifts.',
    variables: ['schedulePeriod', 'shiftCount', 'scheduleId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/schedule/my-schedule',
    defaultActionLabel: 'View Schedule',
    isSystem: true,
    isActive: true,
  },

  AIR_QUALITY_WARNING: {
    type: 'AIR_QUALITY_WARNING',
    name: 'Air Quality Warning',
    category: 'AIR_QUALITY',
    defaultPriority: 'HIGH',
    titleTemplate: 'Air Quality Warning',
    messageTemplate: '{{gasType}} levels elevated at {{facilityName}}: {{level}} ppm',
    emailSubjectTemplate: 'Air Quality Warning - {{facilityName}}',
    emailBodyTemplate: `
      <h2 style="color: #f59e0b;">⚠️ Air Quality Warning</h2>
      <p><strong>Facility:</strong> {{facilityName}}</p>
      <p><strong>{{gasType}} Level:</strong> {{level}} ppm</p>
      <p><strong>Threshold:</strong> {{threshold}} ppm</p>
      <p>Please monitor conditions and take appropriate action.</p>
    `,
    smsTemplate: '⚠️ AIR QUALITY: {{gasType}} at {{level}} ppm at {{facilityName}}',
    variables: ['gasType', 'level', 'threshold', 'facilityName', 'rinkName'],
    defaultChannels: ['IN_APP', 'EMAIL', 'SMS'],
    defaultActionUrl: '/dashboard/air-quality',
    defaultActionLabel: 'View Details',
    isSystem: true,
    isActive: true,
  },

  AIR_QUALITY_CRITICAL: {
    type: 'AIR_QUALITY_CRITICAL',
    name: 'Air Quality Critical',
    category: 'AIR_QUALITY',
    defaultPriority: 'URGENT',
    titleTemplate: 'CRITICAL: Air Quality Alert',
    messageTemplate: 'CRITICAL: {{gasType}} at {{level}} ppm at {{facilityName}}',
    emailSubjectTemplate: '🚨 CRITICAL Air Quality Alert - {{facilityName}}',
    emailBodyTemplate: `
      <h2 style="color: #ef4444;">🚨 CRITICAL Air Quality Alert</h2>
      <p><strong>Facility:</strong> {{facilityName}}</p>
      <p><strong>{{gasType}} Level:</strong> {{level}} ppm</p>
      <p><strong>Threshold:</strong> {{threshold}} ppm</p>
      <p style="color: #ef4444;"><strong>IMMEDIATE ACTION REQUIRED</strong></p>
    `,
    smsTemplate: '🚨 CRITICAL: {{gasType}} at {{level}} ppm - {{facilityName}}. ACT NOW!',
    variables: ['gasType', 'level', 'threshold', 'facilityName', 'rinkName'],
    defaultChannels: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'],
    defaultActionUrl: '/dashboard/air-quality',
    defaultActionLabel: 'View Alert',
    isSystem: true,
    isActive: true,
  },

  AIR_QUALITY_EVACUATION: {
    type: 'AIR_QUALITY_EVACUATION',
    name: 'Air Quality Evacuation',
    category: 'AIR_QUALITY',
    defaultPriority: 'URGENT',
    titleTemplate: 'EVACUATE: {{facilityName}}',
    messageTemplate: 'EVACUATION REQUIRED: {{gasType}} at dangerous levels',
    emailSubjectTemplate: '🚨🚨 EVACUATE NOW - {{facilityName}}',
    emailBodyTemplate: `
      <h2 style="color: #ef4444; font-size: 24px;">🚨🚨 EVACUATION REQUIRED 🚨🚨</h2>
      <p style="font-size: 18px;"><strong>Facility:</strong> {{facilityName}}</p>
      <p style="font-size: 18px;"><strong>{{gasType}} Level:</strong> {{level}} ppm (DANGEROUS)</p>
      <p style="color: #ef4444; font-size: 20px;"><strong>EVACUATE IMMEDIATELY</strong></p>
    `,
    smsTemplate: '🚨🚨 EVACUATE {{facilityName}} NOW! {{gasType}} at {{level}} ppm',
    variables: ['gasType', 'level', 'facilityName', 'rinkName'],
    defaultChannels: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'],
    defaultActionUrl: '/dashboard/air-quality',
    defaultActionLabel: 'View Alert',
    isSystem: true,
    isActive: true,
  },

  SUBMISSION_REMINDER: {
    type: 'SUBMISSION_REMINDER',
    name: 'Submission Reminder',
    category: 'REPORTS',
    defaultPriority: 'LOW',
    titleTemplate: 'Reminder: {{reportType}} Due',
    messageTemplate: 'Your {{reportType}} report is due',
    emailSubjectTemplate: 'Reminder: {{reportType}} Report Due',
    emailBodyTemplate: `
      <h2>Report Reminder</h2>
      <p>This is a reminder that your {{reportType}} report is due.</p>
    `,
    smsTemplate: 'Reminder: {{reportType}} report due.',
    variables: ['reportType'],
    defaultChannels: ['IN_APP'],
    defaultActionUrl: '/dashboard/{{reportPath}}/new',
    defaultActionLabel: 'Submit Report',
    isSystem: true,
    isActive: true,
  },

  APPROVAL_REQUIRED: {
    type: 'APPROVAL_REQUIRED',
    name: 'Approval Required',
    category: 'ADMIN',
    defaultPriority: 'NORMAL',
    titleTemplate: 'Approval Required',
    messageTemplate: '{{submissionType}} from {{submittedBy}} needs your approval',
    emailSubjectTemplate: 'Approval Required: {{submissionType}}',
    emailBodyTemplate: `
      <h2>Approval Required</h2>
      <p>A {{submissionType}} from {{submittedBy}} requires your approval.</p>
      <p><strong>Submitted:</strong> {{submittedAt}}</p>
    `,
    smsTemplate: 'Approval needed: {{submissionType}} from {{submittedBy}}',
    variables: ['submissionType', 'submittedBy', 'submittedAt', 'submissionId'],
    defaultChannels: ['IN_APP', 'EMAIL'],
    defaultActionUrl: '/dashboard/{{submissionPath}}/{{submissionId}}',
    defaultActionLabel: 'Review',
    isSystem: true,
    isActive: true,
  },

  REPORT_SUBMITTED: {
    type: 'REPORT_SUBMITTED',
    name: 'Report Submitted',
    category: 'REPORTS',
    defaultPriority: 'LOW',
    titleTemplate: 'Report Submitted',
    messageTemplate: 'Your {{reportType}} report has been submitted',
    emailSubjectTemplate: 'Report Submitted: {{reportType}}',
    emailBodyTemplate: `
      <h2>Report Submitted</h2>
      <p>Your {{reportType}} report has been submitted successfully.</p>
      <p><strong>Reference:</strong> {{referenceId}}</p>
    `,
    smsTemplate: '{{reportType}} report submitted.',
    variables: ['reportType', 'referenceId'],
    defaultChannels: ['IN_APP'],
    defaultActionUrl: '/dashboard/{{reportPath}}/{{reportId}}',
    defaultActionLabel: 'View Report',
    isSystem: true,
    isActive: true,
  },

  SYSTEM_ANNOUNCEMENT: {
    type: 'SYSTEM_ANNOUNCEMENT',
    name: 'System Announcement',
    category: 'SYSTEM',
    defaultPriority: 'NORMAL',
    titleTemplate: '{{title}}',
    messageTemplate: '{{message}}',
    emailSubjectTemplate: '{{title}}',
    emailBodyTemplate: `
      <h2>{{title}}</h2>
      <p>{{message}}</p>
    `,
    smsTemplate: '{{title}}: {{shortMessage}}',
    variables: ['title', 'message', 'shortMessage'],
    defaultChannels: ['IN_APP'],
    isSystem: true,
    isActive: true,
  },

  CUSTOM: {
    type: 'CUSTOM',
    name: 'Custom Notification',
    category: 'SYSTEM',
    defaultPriority: 'NORMAL',
    titleTemplate: '{{title}}',
    messageTemplate: '{{message}}',
    emailSubjectTemplate: '{{title}}',
    emailBodyTemplate: `<h2>{{title}}</h2><p>{{message}}</p>`,
    smsTemplate: '{{title}}: {{message}}',
    variables: ['title', 'message'],
    defaultChannels: ['IN_APP'],
    isSystem: false,
    isActive: true,
  },
}

// ============================================
// API TYPES
// ============================================

export interface CreateNotificationInput {
  type: NotificationType
  recipientId?: string
  recipientIds?: string[]
  recipientType?: 'USER' | 'ROLE' | 'FACILITY' | 'BROADCAST'
  roleId?: string // If recipientType is ROLE
  facilityId?: string // If recipientType is FACILITY
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  data?: NotificationData
  customTitle?: string
  customMessage?: string
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
  scheduleAt?: string // For scheduled notifications
}

export interface NotificationFilters {
  userId?: string
  status?: NotificationStatus
  category?: NotificationCategory
  type?: NotificationType
  priority?: NotificationPriority
  unreadOnly?: boolean
  startDate?: string
  endDate?: string
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
  byPriority: Record<NotificationPriority, number>
}

// ============================================
// EMAIL TYPES
// ============================================

export interface EmailConfig {
  from: string
  replyTo?: string
  provider: 'resend' | 'sendgrid' | 'smtp'
}

export interface EmailMessage {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: EmailAttachment[]
  tags?: Record<string, string>
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================
// SMS TYPES
// ============================================

export interface SMSConfig {
  provider: 'twilio' | 'vonage'
  fromNumber: string
}

export interface SMSMessage {
  to: string
  body: string
  from?: string
  mediaUrl?: string[]
}

export interface SMSSendResult {
  success: boolean
  messageId?: string
  error?: string
  status?: string
}

// ============================================
// PUSH NOTIFICATION TYPES
// ============================================

export interface PushSubscription {
  id: string
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  deviceType: 'web' | 'ios' | 'android'
  deviceName?: string
  createdAt: string
  lastUsedAt: string
}

export interface PushMessage {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, unknown>
  actions?: PushAction[]
  tag?: string
  requireInteraction?: boolean
}

export interface PushAction {
  action: string
  title: string
  icon?: string
}

export interface PushSendResult {
  success: boolean
  endpoint: string
  error?: string
}
