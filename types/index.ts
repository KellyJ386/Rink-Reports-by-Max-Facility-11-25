import { User, Role, Facility, Rink } from '@prisma/client'

export type UserWithRole = User & {
  role: Role
  facility: Facility
}

export interface ModulePermissions {
  access: boolean
  submit?: boolean
  viewOwn?: boolean
  viewAll?: boolean
  edit?: boolean
  delete?: boolean
  export?: boolean
  approve?: boolean
  createTemplates?: boolean
  create?: boolean
  publish?: boolean
}

export interface PermissionSet {
  admin: ModulePermissions
  iceDepth: ModulePermissions
  iceOperations: ModulePermissions
  refrigeration: ModulePermissions
  airQuality: ModulePermissions
  incidents: ModulePermissions
  schedule: ModulePermissions
  dailyChecklist: ModulePermissions
}

export type ModuleType =
  | 'admin'
  | 'iceDepth'
  | 'iceOperations'
  | 'refrigeration'
  | 'airQuality'
  | 'incidents'
  | 'schedule'
  | 'dailyChecklist'

export interface JWTPayload {
  userId: string
  email: string
  facilityId: string
  roleId: string
}

export interface AuthSession {
  user: UserWithRole
  token: string
}

// ===========================================
// Form Builder Types
// ===========================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'signature'
  | 'photo'
  | 'file'
  | 'heading'
  | 'paragraph'
  | 'divider'
  // Specialized fields
  | 'iceDepthGrid'
  | 'bodyDiagram'

export interface SelectOption {
  label: string
  value: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: string | number | boolean
  message: string
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string // Field name for form data
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean | string[]
  options?: SelectOption[] // For select, multiselect, radio, checkbox
  validation?: ValidationRule[]
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  width?: 'full' | 'half' | 'third' | 'quarter'
  // For number fields
  min?: number
  max?: number
  step?: number
  // For text fields
  minLength?: number
  maxLength?: number
  // For file/photo fields
  accept?: string
  maxSize?: number // in bytes
  // Compliance flag - locked fields can't be removed
  isCompliance?: boolean
  // Conditional display
  conditionalOn?: string // Field ID this depends on
  conditionalValue?: string | number | boolean | string[]
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface FormSchema {
  sections: FormSection[]
  settings?: {
    requireSignature?: boolean
    requirePhoto?: boolean
    allowDraft?: boolean
    notifyOnSubmit?: string[] // User IDs to notify
  }
}

export interface ConditionalRule {
  id: string
  sourceFieldId: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value?: string | number | boolean
  targetFieldId: string
  action: 'show' | 'hide' | 'require' | 'disable'
}

export interface CalculatedField {
  id: string
  targetFieldId: string
  formula: string // e.g., "field1 + field2" or "average(field1, field2, field3)"
  sourceFieldIds: string[]
}

// Form Template - matches Prisma model
export interface FormTemplateData {
  id: string
  facilityId: string
  moduleType: string
  name: string
  description?: string
  version: number
  isActive: boolean
  isLocked: boolean
  schema: FormSchema
  conditionalRules?: ConditionalRule[]
  calculatedFields?: CalculatedField[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  previousVersionId?: string
}

// Submission - matches Prisma model
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'

export interface SubmissionData {
  id: string
  formTemplateId: string
  facilityId: string
  rinkId?: string
  userId: string
  status: SubmissionStatus
  data: Record<string, unknown>
  submittedAt?: Date
  reviewedBy?: string
  reviewedAt?: Date
  reviewNotes?: string
  createdAt: Date
  updatedAt: Date
}

// Field palette item for drag-and-drop
export interface FieldPaletteItem {
  type: FieldType
  label: string
  icon: string
  category: 'basic' | 'choice' | 'date' | 'media' | 'layout' | 'specialized'
  defaultConfig: Partial<FormField>
}
