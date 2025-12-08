// Form Builder Type Definitions
// These types define the schema for dynamic form creation

export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'signature'
  | 'calculated'
  | 'section'
  | 'divider'

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: string | number
  message: string
}

export interface SelectOption {
  label: string
  value: string
}

export interface ConditionalRule {
  id: string
  sourceFieldId: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value?: string | number | boolean
  action: 'show' | 'hide' | 'require' | 'unrequire'
}

export interface CalculatedFieldConfig {
  formula: string // e.g., "AVG(field1, field2, field3)" or "SUM(field1, field2)"
  sourceFields: string[] // IDs of fields used in calculation
  operation: 'sum' | 'average' | 'min' | 'max' | 'count' | 'custom'
  decimalPlaces?: number
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string // Unique field name for data storage
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean
  required: boolean
  readOnly?: boolean
  hidden?: boolean

  // Validation
  validation?: ValidationRule[]

  // For select, radio, checkbox
  options?: SelectOption[]

  // For number fields
  min?: number
  max?: number
  step?: number
  unit?: string // e.g., "°F", "inches", "ppm"

  // For text fields
  minLength?: number
  maxLength?: number
  pattern?: string

  // For calculated fields
  calculatedConfig?: CalculatedFieldConfig

  // Conditional visibility
  conditionalRules?: ConditionalRule[]

  // Layout
  width?: 'full' | 'half' | 'third' | 'quarter'

  // For sections
  collapsed?: boolean
  sectionDescription?: string

  // Compliance flag - prevents editing in production
  isLocked?: boolean

  // Order in form
  order: number
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  collapsed?: boolean
  order: number
}

export interface FormSchema {
  id: string
  version: number
  title: string
  description?: string
  sections: FormSection[]
  settings: FormSettings
}

export interface FormSettings {
  requireSignature: boolean
  allowDraft: boolean
  allowOfflineSubmission: boolean
  notifyOnSubmission: boolean
  requireApproval: boolean
  autoCalculateOnChange: boolean
}

// Template metadata stored in FormTemplate model
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
  calculatedFields?: CalculatedFieldConfig[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Field palette item for drag-and-drop
export interface FieldPaletteItem {
  type: FieldType
  label: string
  icon: string
  description: string
  defaultConfig: Partial<FormField>
}

// Form builder state
export interface FormBuilderState {
  schema: FormSchema
  selectedFieldId: string | null
  selectedSectionId: string | null
  isDirty: boolean
  isPreviewMode: boolean
  errors: Record<string, string[]>
}

// API request/response types
export interface CreateFormTemplateRequest {
  facilityId: string
  moduleType: string
  name: string
  description?: string
  schema: FormSchema
}

export interface UpdateFormTemplateRequest {
  name?: string
  description?: string
  schema?: FormSchema
  isActive?: boolean
}

// Form submission types
export interface FormSubmissionData {
  [fieldName: string]: string | number | boolean | null | string[]
}

export interface FormSubmission {
  id: string
  formTemplateId: string
  formVersionAtSubmission: number
  rinkId: string
  submittedById: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: string
  data: FormSubmissionData
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  attachments?: FormAttachment[]
}

export interface FormAttachment {
  id: string
  fieldId: string
  type: 'SIGNATURE' | 'DOCUMENT'
  fileName: string
  fileSize: number
  mimeType: string
  url?: string
}

// Drag and drop types
export interface DragItem {
  id: string
  type: 'palette-item' | 'field' | 'section'
  data: FieldPaletteItem | FormField | FormSection
}

export interface DropResult {
  targetSectionId: string
  targetIndex: number
}

// Field palette configuration
export const FIELD_PALETTE_ITEMS: FieldPaletteItem[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: 'Aa',
    description: 'Single line text field',
    defaultConfig: { required: false, width: 'full' }
  },
  {
    type: 'number',
    label: 'Number',
    icon: '#',
    description: 'Numeric input with optional unit',
    defaultConfig: { required: false, width: 'half' }
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: '¶',
    description: 'Multi-line text input',
    defaultConfig: { required: false, width: 'full' }
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: '▼',
    description: 'Select from predefined options',
    defaultConfig: { required: false, width: 'half', options: [] }
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: '☑',
    description: 'Yes/No checkbox',
    defaultConfig: { required: false, width: 'half' }
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: '◉',
    description: 'Single selection from options',
    defaultConfig: { required: false, width: 'full', options: [] }
  },
  {
    type: 'date',
    label: 'Date',
    icon: '📅',
    description: 'Date picker',
    defaultConfig: { required: false, width: 'half' }
  },
  {
    type: 'time',
    label: 'Time',
    icon: '🕐',
    description: 'Time picker',
    defaultConfig: { required: false, width: 'half' }
  },
  {
    type: 'datetime',
    label: 'Date & Time',
    icon: '📆',
    description: 'Combined date and time picker',
    defaultConfig: { required: false, width: 'half' }
  },
  {
    type: 'signature',
    label: 'Signature',
    icon: '✍',
    description: 'Digital signature capture',
    defaultConfig: { required: false, width: 'full' }
  },
  {
    type: 'calculated',
    label: 'Calculated',
    icon: 'fx',
    description: 'Auto-calculated from other fields',
    defaultConfig: { required: false, readOnly: true, width: 'half' }
  },
  {
    type: 'section',
    label: 'Section',
    icon: '§',
    description: 'Group related fields together',
    defaultConfig: { width: 'full' }
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: '—',
    description: 'Visual separator between fields',
    defaultConfig: { width: 'full' }
  }
]

// Module type options for form templates
export const MODULE_TYPE_OPTIONS = [
  { value: 'ICE_DEPTH', label: 'Ice Depth' },
  { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
  { value: 'REFRIGERATION', label: 'Refrigeration' },
  { value: 'AIR_QUALITY', label: 'Air Quality' },
  { value: 'INCIDENT', label: 'Incident Report' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'DAILY_CHECKLIST', label: 'Daily Checklist' }
]

// Helper to generate unique field IDs
export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper to generate unique section IDs
export function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create empty form schema
export function createEmptyFormSchema(): FormSchema {
  return {
    id: `schema_${Date.now()}`,
    version: 1,
    title: 'Untitled Form',
    description: '',
    sections: [
      {
        id: generateSectionId(),
        title: 'Main Section',
        fields: [],
        order: 0
      }
    ],
    settings: {
      requireSignature: false,
      allowDraft: true,
      allowOfflineSubmission: true,
      notifyOnSubmission: false,
      requireApproval: false,
      autoCalculateOnChange: true
    }
  }
}

// Create a new field from palette item
export function createFieldFromPalette(item: FieldPaletteItem, order: number): FormField {
  return {
    id: generateFieldId(),
    type: item.type,
    label: item.label,
    name: `${item.type}_${Date.now()}`,
    required: false,
    order,
    ...item.defaultConfig
  }
}
