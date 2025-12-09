// Equipment and Maintenance Types
// For tracking facility equipment and maintenance schedules

export type EquipmentCategory =
  | 'REFRIGERATION'
  | 'RESURFACER'
  | 'HVAC'
  | 'DEHUMIDIFIER'
  | 'LIGHTING'
  | 'COMPRESSOR'
  | 'PUMP'
  | 'BOARDS'
  | 'GLASS'
  | 'NETTING'
  | 'SCOREBOARD'
  | 'SOUND_SYSTEM'
  | 'OTHER'

export type EquipmentStatus =
  | 'OPERATIONAL'
  | 'NEEDS_MAINTENANCE'
  | 'IN_MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'RETIRED'

export type MaintenanceType =
  | 'PREVENTIVE'
  | 'CORRECTIVE'
  | 'EMERGENCY'
  | 'INSPECTION'
  | 'CALIBRATION'

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type MaintenanceStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'

export interface Equipment {
  id: string
  facilityId: string
  name: string
  category: EquipmentCategory
  manufacturer?: string
  model?: string
  serialNumber?: string
  location: string
  status: EquipmentStatus
  purchaseDate?: string
  warrantyExpiration?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  maintenanceIntervalDays?: number
  totalOperatingHours?: number
  notes?: string
  specifications?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  equipment?: Equipment
  facilityId: string
  type: MaintenanceType
  priority: MaintenancePriority
  status: MaintenanceStatus
  title: string
  description: string
  scheduledDate: string
  scheduledTime?: string
  completedDate?: string
  estimatedDuration: number // minutes
  actualDuration?: number
  assignedTo?: string
  assigneeName?: string
  cost?: number
  vendor?: string
  partsUsed?: MaintenancePart[]
  checklistItems?: MaintenanceChecklistItem[]
  notes?: string
  attachments?: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MaintenancePart {
  id: string
  name: string
  partNumber?: string
  quantity: number
  unitCost?: number
  supplier?: string
}

export interface MaintenanceChecklistItem {
  id: string
  task: string
  completed: boolean
  completedAt?: string
  completedBy?: string
  notes?: string
}

export interface MaintenanceSchedule {
  id: string
  equipmentId: string
  facilityId: string
  name: string
  type: MaintenanceType
  frequency: MaintenanceFrequency
  intervalDays?: number
  dayOfWeek?: number
  dayOfMonth?: number
  monthOfYear?: number
  duration: number
  tasks: string[]
  assignedRole?: string
  isActive: boolean
  lastRun?: string
  nextRun: string
  createdAt: string
  updatedAt: string
}

export type MaintenanceFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'BIANNUALLY'
  | 'ANNUALLY'
  | 'CUSTOM'

// Dashboard and statistics types
export interface EquipmentStats {
  total: number
  byStatus: Record<EquipmentStatus, number>
  byCategory: Record<EquipmentCategory, number>
  needingMaintenance: number
  overdueMaintenace: number
}

export interface MaintenanceStats {
  total: number
  scheduled: number
  completed: number
  overdue: number
  inProgress: number
  avgCompletionTime: number
  totalCost: number
  byType: Record<MaintenanceType, number>
}

export interface EquipmentAlert {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'MAINTENANCE_DUE' | 'WARRANTY_EXPIRING' | 'STATUS_CHANGE' | 'OVERDUE'
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  dueDate?: string
  acknowledged: boolean
  createdAt: string
}

// Form inputs
export interface CreateEquipmentInput {
  name: string
  category: EquipmentCategory
  manufacturer?: string
  model?: string
  serialNumber?: string
  location: string
  status?: EquipmentStatus
  purchaseDate?: string
  warrantyExpiration?: string
  maintenanceIntervalDays?: number
  notes?: string
}

export interface CreateMaintenanceInput {
  equipmentId: string
  type: MaintenanceType
  priority: MaintenancePriority
  title: string
  description: string
  scheduledDate: string
  scheduledTime?: string
  estimatedDuration: number
  assignedTo?: string
  checklistItems?: string[]
}

export interface UpdateMaintenanceInput {
  status?: MaintenanceStatus
  completedDate?: string
  actualDuration?: number
  cost?: number
  partsUsed?: MaintenancePart[]
  notes?: string
}

// Helpers
export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
  REFRIGERATION: 'Refrigeration System',
  RESURFACER: 'Ice Resurfacer (Zamboni)',
  HVAC: 'HVAC System',
  DEHUMIDIFIER: 'Dehumidifier',
  LIGHTING: 'Lighting',
  COMPRESSOR: 'Compressor',
  PUMP: 'Pump',
  BOARDS: 'Rink Boards',
  GLASS: 'Glass/Shielding',
  NETTING: 'Safety Netting',
  SCOREBOARD: 'Scoreboard',
  SOUND_SYSTEM: 'Sound System',
  OTHER: 'Other',
}

export const equipmentStatusColors: Record<EquipmentStatus, string> = {
  OPERATIONAL: 'bg-green-100 text-green-800 border-green-300',
  NEEDS_MAINTENANCE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  IN_MAINTENANCE: 'bg-blue-100 text-blue-800 border-blue-300',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-300',
  RETIRED: 'bg-gray-100 text-gray-800 border-gray-300',
}

export const maintenancePriorityColors: Record<MaintenancePriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

export const maintenanceStatusColors: Record<MaintenanceStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  OVERDUE: 'bg-red-100 text-red-800',
}
