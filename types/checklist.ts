// Checklist Types with Templates and Completion Tracking
// Comprehensive checklist management system

export type ChecklistCategory =
  | 'OPENING'
  | 'CLOSING'
  | 'SAFETY'
  | 'EQUIPMENT'
  | 'ICE_MAINTENANCE'
  | 'HVAC'
  | 'CLEANING'
  | 'RESURFACER'
  | 'EMERGENCY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CUSTOM'

export type ChecklistFrequency =
  | 'ONCE'
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUALLY'

export type ChecklistItemType =
  | 'CHECKBOX'
  | 'YES_NO'
  | 'PASS_FAIL'
  | 'NUMERIC'
  | 'TEXT'
  | 'PHOTO'
  | 'SIGNATURE'

export type CompletionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'SKIPPED'

// Checklist Template
export interface ChecklistTemplate {
  id: string
  facilityId: string
  name: string
  description?: string
  category: ChecklistCategory
  frequency: ChecklistFrequency
  estimatedDuration: number // minutes
  sections: ChecklistSection[]
  requiredRoles?: string[]
  isActive: boolean
  version: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ChecklistSection {
  id: string
  title: string
  description?: string
  order: number
  items: ChecklistItemTemplate[]
  isRequired: boolean
}

export interface ChecklistItemTemplate {
  id: string
  label: string
  description?: string
  type: ChecklistItemType
  order: number
  isRequired: boolean
  options?: string[] // For pass/fail, yes/no, or custom options
  validation?: ItemValidation
  helpText?: string
  photoRequired?: boolean
  notesRequired?: boolean
  expectedValue?: string | number
  warningThreshold?: number
  criticalThreshold?: number
}

export interface ItemValidation {
  min?: number
  max?: number
  pattern?: string
  errorMessage?: string
}

// Checklist Instance (a completed or in-progress checklist)
export interface ChecklistInstance {
  id: string
  templateId: string
  template?: ChecklistTemplate
  facilityId: string
  status: CompletionStatus
  scheduledDate?: string
  startedAt?: string
  completedAt?: string
  dueBy?: string
  assignedTo?: string
  assignedToName?: string
  completedBy?: string
  completedByName?: string
  sections: CompletedSection[]
  completionPercentage: number
  issues: ChecklistIssue[]
  notes?: string
  signatureUrl?: string
  signedBy?: string
  signedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CompletedSection {
  sectionId: string
  title: string
  items: CompletedItem[]
  completedAt?: string
  notes?: string
}

export interface CompletedItem {
  itemId: string
  label: string
  type: ChecklistItemType
  value: string | number | boolean | null
  status: 'pending' | 'completed' | 'skipped' | 'issue'
  completedAt?: string
  completedBy?: string
  notes?: string
  photoUrl?: string
  issue?: ChecklistIssue
}

export interface ChecklistIssue {
  id: string
  itemId: string
  itemLabel: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED'
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionNotes?: string
  followUpRequired: boolean
}

// Scheduling
export interface ChecklistSchedule {
  id: string
  templateId: string
  facilityId: string
  frequency: ChecklistFrequency
  time?: string
  dayOfWeek?: number
  dayOfMonth?: number
  assignedRole?: string
  isActive: boolean
  lastRun?: string
  nextRun: string
  createdAt: string
  updatedAt: string
}

// Statistics
export interface ChecklistStats {
  totalTemplates: number
  activeTemplates: number
  completedToday: number
  completedThisWeek: number
  overdueCount: number
  inProgressCount: number
  avgCompletionTime: number // minutes
  complianceRate: number // percentage
  issuesOpen: number
  issuesCritical: number
  byCategory: Record<ChecklistCategory, number>
}

export interface TemplateStats {
  templateId: string
  templateName: string
  timesCompleted: number
  avgCompletionTime: number
  complianceRate: number
  commonIssues: string[]
  lastCompleted?: string
}

// UI helpers
export const categoryLabels: Record<ChecklistCategory, string> = {
  OPENING: 'Opening Procedures',
  CLOSING: 'Closing Procedures',
  SAFETY: 'Safety Inspection',
  EQUIPMENT: 'Equipment Check',
  ICE_MAINTENANCE: 'Ice Maintenance',
  HVAC: 'HVAC Inspection',
  CLEANING: 'Cleaning',
  RESURFACER: 'Resurfacer Check',
  EMERGENCY: 'Emergency Procedures',
  DAILY: 'Daily Tasks',
  WEEKLY: 'Weekly Tasks',
  MONTHLY: 'Monthly Tasks',
  CUSTOM: 'Custom',
}

export const categoryColors: Record<ChecklistCategory, string> = {
  OPENING: 'bg-green-100 text-green-800',
  CLOSING: 'bg-blue-100 text-blue-800',
  SAFETY: 'bg-red-100 text-red-800',
  EQUIPMENT: 'bg-purple-100 text-purple-800',
  ICE_MAINTENANCE: 'bg-cyan-100 text-cyan-800',
  HVAC: 'bg-orange-100 text-orange-800',
  CLEANING: 'bg-yellow-100 text-yellow-800',
  RESURFACER: 'bg-indigo-100 text-indigo-800',
  EMERGENCY: 'bg-red-100 text-red-800',
  DAILY: 'bg-gray-100 text-gray-800',
  WEEKLY: 'bg-blue-100 text-blue-800',
  MONTHLY: 'bg-purple-100 text-purple-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
}

export const statusColors: Record<CompletionStatus, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
}

export const frequencyLabels: Record<ChecklistFrequency, string> = {
  ONCE: 'One-time',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
}

// Form inputs
export interface CreateTemplateInput {
  name: string
  description?: string
  category: ChecklistCategory
  frequency: ChecklistFrequency
  estimatedDuration: number
  sections: Omit<ChecklistSection, 'id'>[]
}

export interface StartChecklistInput {
  templateId: string
  scheduledDate?: string
  assignedTo?: string
  dueBy?: string
}

export interface UpdateItemInput {
  instanceId: string
  itemId: string
  value: string | number | boolean
  notes?: string
  photoUrl?: string
}

// Default templates
export const defaultTemplates: Partial<ChecklistTemplate>[] = [
  {
    name: 'Daily Opening Checklist',
    category: 'OPENING',
    frequency: 'DAILY',
    estimatedDuration: 30,
    description: 'Complete before facility opens to the public',
    sections: [
      {
        id: 'sec-1',
        title: 'Facility Access',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'Unlock all entrance doors', type: 'CHECKBOX', order: 1, isRequired: true },
          { id: 'item-2', label: 'Disable alarm system', type: 'CHECKBOX', order: 2, isRequired: true },
          { id: 'item-3', label: 'Check for overnight issues or damage', type: 'YES_NO', order: 3, isRequired: true },
        ],
      },
      {
        id: 'sec-2',
        title: 'Ice Condition',
        order: 2,
        isRequired: true,
        items: [
          { id: 'item-4', label: 'Ice surface temperature', type: 'NUMERIC', order: 1, isRequired: true, expectedValue: 22 },
          { id: 'item-5', label: 'Ice condition is acceptable', type: 'PASS_FAIL', order: 2, isRequired: true },
          { id: 'item-6', label: 'Complete initial resurface', type: 'CHECKBOX', order: 3, isRequired: true },
        ],
      },
      {
        id: 'sec-3',
        title: 'Safety Equipment',
        order: 3,
        isRequired: true,
        items: [
          { id: 'item-7', label: 'First aid kit stocked', type: 'PASS_FAIL', order: 1, isRequired: true },
          { id: 'item-8', label: 'AED operational', type: 'PASS_FAIL', order: 2, isRequired: true },
          { id: 'item-9', label: 'Emergency exits clear', type: 'PASS_FAIL', order: 3, isRequired: true },
        ],
      },
    ],
  },
  {
    name: 'Daily Closing Checklist',
    category: 'CLOSING',
    frequency: 'DAILY',
    estimatedDuration: 25,
    description: 'Complete after all patrons have left',
    sections: [
      {
        id: 'sec-1',
        title: 'Patron Area',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'All patrons have exited', type: 'CHECKBOX', order: 1, isRequired: true },
          { id: 'item-2', label: 'Locker rooms checked and empty', type: 'CHECKBOX', order: 2, isRequired: true },
          { id: 'item-3', label: 'Lost and found collected', type: 'CHECKBOX', order: 3, isRequired: true },
        ],
      },
      {
        id: 'sec-2',
        title: 'Equipment',
        order: 2,
        isRequired: true,
        items: [
          { id: 'item-4', label: 'Rental skates returned and stored', type: 'CHECKBOX', order: 1, isRequired: true },
          { id: 'item-5', label: 'Zamboni parked and plugged in', type: 'CHECKBOX', order: 2, isRequired: true },
          { id: 'item-6', label: 'Equipment issues noted', type: 'TEXT', order: 3, isRequired: false },
        ],
      },
      {
        id: 'sec-3',
        title: 'Security',
        order: 3,
        isRequired: true,
        items: [
          { id: 'item-7', label: 'All doors locked', type: 'CHECKBOX', order: 1, isRequired: true },
          { id: 'item-8', label: 'Alarm system activated', type: 'CHECKBOX', order: 2, isRequired: true },
          { id: 'item-9', label: 'Lights turned off', type: 'CHECKBOX', order: 3, isRequired: true },
        ],
      },
    ],
  },
  {
    name: 'Weekly Safety Inspection',
    category: 'SAFETY',
    frequency: 'WEEKLY',
    estimatedDuration: 45,
    description: 'Comprehensive safety inspection of all facility areas',
    sections: [
      {
        id: 'sec-1',
        title: 'Fire Safety',
        order: 1,
        isRequired: true,
        items: [
          { id: 'item-1', label: 'Fire extinguishers inspected', type: 'PASS_FAIL', order: 1, isRequired: true },
          { id: 'item-2', label: 'Emergency lighting functional', type: 'PASS_FAIL', order: 2, isRequired: true },
          { id: 'item-3', label: 'Fire exits unobstructed', type: 'PASS_FAIL', order: 3, isRequired: true },
        ],
      },
      {
        id: 'sec-2',
        title: 'Rink Barriers',
        order: 2,
        isRequired: true,
        items: [
          { id: 'item-4', label: 'Boards secure and undamaged', type: 'PASS_FAIL', order: 1, isRequired: true },
          { id: 'item-5', label: 'Glass/plexiglass condition', type: 'PASS_FAIL', order: 2, isRequired: true },
          { id: 'item-6', label: 'Netting secure', type: 'PASS_FAIL', order: 3, isRequired: true },
        ],
      },
    ],
  },
]

// Utility functions
export function calculateCompletionPercentage(sections: CompletedSection[]): number {
  let totalItems = 0
  let completedItems = 0

  for (const section of sections) {
    for (const item of section.items) {
      totalItems++
      if (item.status === 'completed') {
        completedItems++
      }
    }
  }

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
}

export function isChecklistOverdue(instance: ChecklistInstance): boolean {
  if (instance.status === 'COMPLETED') return false
  if (!instance.dueBy) return false
  return new Date() > new Date(instance.dueBy)
}

export function getNextScheduledDate(schedule: ChecklistSchedule): Date {
  const now = new Date()

  switch (schedule.frequency) {
    case 'DAILY':
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      if (schedule.time) {
        const [hours, minutes] = schedule.time.split(':').map(Number)
        tomorrow.setHours(hours, minutes, 0, 0)
      }
      return tomorrow

    case 'WEEKLY':
      const nextWeek = new Date(now)
      const targetDay = schedule.dayOfWeek || 1
      const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7
      nextWeek.setDate(nextWeek.getDate() + daysUntil)
      return nextWeek

    case 'MONTHLY':
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, schedule.dayOfMonth || 1)
      return nextMonth

    default:
      return now
  }
}
