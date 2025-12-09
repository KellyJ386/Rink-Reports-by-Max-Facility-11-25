// Incident Types with Follow-up Tracking and Escalation Workflow
// Comprehensive incident management system

export type IncidentSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL'

export type IncidentStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'ESCALATED'

export type IncidentType =
  | 'SLIP_FALL'
  | 'COLLISION'
  | 'EQUIPMENT_FAILURE'
  | 'MEDICAL_EMERGENCY'
  | 'PROPERTY_DAMAGE'
  | 'SECURITY'
  | 'ENVIRONMENTAL'
  | 'NEAR_MISS'
  | 'OTHER'

export type FollowUpType =
  | 'PHONE_CALL'
  | 'EMAIL'
  | 'IN_PERSON'
  | 'MEDICAL_CHECK'
  | 'INSURANCE_CLAIM'
  | 'DOCUMENTATION'
  | 'CORRECTIVE_ACTION'
  | 'OTHER'

export type EscalationLevel = 1 | 2 | 3 | 4 // 1=Supervisor, 2=Manager, 3=Director, 4=Executive

export interface Incident {
  id: string
  facilityId: string
  reportNumber: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  description: string
  location: string
  incidentDate: string
  incidentTime: string
  reportedBy: string
  reportedByName: string
  reportedAt: string

  // Injured party information
  injuredParty?: InjuredParty

  // Witnesses
  witnesses?: Witness[]

  // Response and resolution
  immediateActions?: string
  rootCause?: string
  correctiveActions?: string
  preventiveMeasures?: string

  // Follow-up tracking
  followUps: FollowUp[]
  nextFollowUpDate?: string
  requiresFollowUp: boolean

  // Escalation
  escalationLevel?: EscalationLevel
  escalatedTo?: string
  escalatedToName?: string
  escalatedAt?: string
  escalationReason?: string
  escalationHistory: EscalationRecord[]

  // Resolution
  resolvedBy?: string
  resolvedByName?: string
  resolvedAt?: string
  resolutionSummary?: string

  // Insurance and legal
  insuranceClaimed: boolean
  insuranceClaimNumber?: string
  insuranceClaimStatus?: InsuranceClaimStatus
  legalInvolved: boolean
  legalNotes?: string

  // Attachments
  attachments?: Attachment[]
  photos?: string[]

  // Audit
  createdAt: string
  updatedAt: string
  closedAt?: string
}

export interface InjuredParty {
  name: string
  phone?: string
  email?: string
  age?: number
  relationship: 'PATRON' | 'EMPLOYEE' | 'CONTRACTOR' | 'VISITOR' | 'OTHER'
  injuryDescription?: string
  injuryLocation?: string
  medicalAttentionRequired: boolean
  medicalAttentionProvided?: boolean
  hospitalName?: string
  treatmentDetails?: string
  refusedTreatment?: boolean
}

export interface Witness {
  id: string
  name: string
  phone?: string
  email?: string
  statement?: string
  statementDate?: string
  relationship: string
}

export interface FollowUp {
  id: string
  incidentId: string
  type: FollowUpType
  scheduledDate: string
  scheduledTime?: string
  completedDate?: string
  completedBy?: string
  completedByName?: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
  description: string
  outcome?: string
  notes?: string
  nextAction?: string
  nextFollowUpNeeded?: boolean
  createdAt: string
  updatedAt: string
}

export interface EscalationRecord {
  id: string
  incidentId: string
  fromLevel: EscalationLevel | null
  toLevel: EscalationLevel
  escalatedTo: string
  escalatedToName: string
  escalatedBy: string
  escalatedByName: string
  reason: string
  timestamp: string
  acknowledged: boolean
  acknowledgedAt?: string
  response?: string
}

export interface Attachment {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  uploadedBy: string
  uploadedAt: string
  description?: string
}

export type InsuranceClaimStatus =
  | 'NOT_FILED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DENIED'
  | 'CLOSED'

// Escalation rules based on severity and time
export interface EscalationRule {
  severity: IncidentSeverity
  initialLevel: EscalationLevel
  autoEscalateAfterHours: number
  maxLevel: EscalationLevel
  requiresImmediateNotification: boolean
  notifyRoles: string[]
}

export const defaultEscalationRules: EscalationRule[] = [
  {
    severity: 'MINOR',
    initialLevel: 1,
    autoEscalateAfterHours: 72,
    maxLevel: 2,
    requiresImmediateNotification: false,
    notifyRoles: ['Supervisor'],
  },
  {
    severity: 'MODERATE',
    initialLevel: 1,
    autoEscalateAfterHours: 24,
    maxLevel: 3,
    requiresImmediateNotification: false,
    notifyRoles: ['Supervisor', 'Safety Officer'],
  },
  {
    severity: 'SEVERE',
    initialLevel: 2,
    autoEscalateAfterHours: 4,
    maxLevel: 4,
    requiresImmediateNotification: true,
    notifyRoles: ['Manager', 'Safety Officer', 'HR'],
  },
  {
    severity: 'CRITICAL',
    initialLevel: 3,
    autoEscalateAfterHours: 1,
    maxLevel: 4,
    requiresImmediateNotification: true,
    notifyRoles: ['Director', 'Legal', 'CEO', 'Safety Officer'],
  },
]

// UI helpers
export const severityColors: Record<IncidentSeverity, string> = {
  MINOR: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MODERATE: 'bg-orange-100 text-orange-800 border-orange-300',
  SEVERE: 'bg-red-100 text-red-800 border-red-300',
  CRITICAL: 'bg-red-200 text-red-900 border-red-500',
}

export const statusColors: Record<IncidentStatus, string> = {
  REPORTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-purple-100 text-purple-800',
  INVESTIGATING: 'bg-indigo-100 text-indigo-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  REOPENED: 'bg-orange-100 text-orange-800',
  ESCALATED: 'bg-red-100 text-red-800',
}

export const incidentTypeLabels: Record<IncidentType, string> = {
  SLIP_FALL: 'Slip and Fall',
  COLLISION: 'Collision',
  EQUIPMENT_FAILURE: 'Equipment Failure',
  MEDICAL_EMERGENCY: 'Medical Emergency',
  PROPERTY_DAMAGE: 'Property Damage',
  SECURITY: 'Security Incident',
  ENVIRONMENTAL: 'Environmental Issue',
  NEAR_MISS: 'Near Miss',
  OTHER: 'Other',
}

export const followUpTypeLabels: Record<FollowUpType, string> = {
  PHONE_CALL: 'Phone Call',
  EMAIL: 'Email',
  IN_PERSON: 'In-Person Meeting',
  MEDICAL_CHECK: 'Medical Check',
  INSURANCE_CLAIM: 'Insurance Claim',
  DOCUMENTATION: 'Documentation',
  CORRECTIVE_ACTION: 'Corrective Action',
  OTHER: 'Other',
}

export const escalationLevelLabels: Record<EscalationLevel, string> = {
  1: 'Supervisor',
  2: 'Manager',
  3: 'Director',
  4: 'Executive',
}

// Form inputs
export interface CreateIncidentInput {
  type: IncidentType
  severity: IncidentSeverity
  title: string
  description: string
  location: string
  incidentDate: string
  incidentTime: string
  injuredParty?: Partial<InjuredParty>
  witnesses?: Partial<Witness>[]
  immediateActions?: string
  photos?: string[]
}

export interface CreateFollowUpInput {
  incidentId: string
  type: FollowUpType
  scheduledDate: string
  scheduledTime?: string
  description: string
}

export interface EscalateIncidentInput {
  incidentId: string
  toLevel: EscalationLevel
  escalatedTo: string
  reason: string
}

// Statistics
export interface IncidentStats {
  total: number
  open: number
  resolved: number
  escalated: number
  bySeverity: Record<IncidentSeverity, number>
  byType: Record<IncidentType, number>
  byStatus: Record<IncidentStatus, number>
  avgResolutionTimeHours: number
  pendingFollowUps: number
  overdueFollowUps: number
}

// Utility functions
export function shouldAutoEscalate(incident: Incident): boolean {
  if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
    return false
  }

  const rule = defaultEscalationRules.find(r => r.severity === incident.severity)
  if (!rule) return false

  const currentLevel = incident.escalationLevel || rule.initialLevel
  if (currentLevel >= rule.maxLevel) return false

  const hoursOpen = (Date.now() - new Date(incident.reportedAt).getTime()) / (1000 * 60 * 60)
  return hoursOpen >= rule.autoEscalateAfterHours
}

export function getNextEscalationLevel(incident: Incident): EscalationLevel | null {
  const currentLevel = incident.escalationLevel || 0
  if (currentLevel >= 4) return null
  return (currentLevel + 1) as EscalationLevel
}

export function isFollowUpOverdue(followUp: FollowUp): boolean {
  if (followUp.status === 'COMPLETED' || followUp.status === 'CANCELLED') {
    return false
  }

  const scheduled = new Date(followUp.scheduledDate)
  if (followUp.scheduledTime) {
    const [hours, minutes] = followUp.scheduledTime.split(':').map(Number)
    scheduled.setHours(hours, minutes)
  } else {
    scheduled.setHours(23, 59, 59)
  }

  return new Date() > scheduled
}

export function generateReportNumber(facilityCode: string = 'FAC'): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${facilityCode}-${year}${month}-${random}`
}
