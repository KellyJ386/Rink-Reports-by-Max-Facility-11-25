// Form Builder Type Definitions

/**
 * Available field types in the form builder
 */
export type FieldType =
  | 'text'           // Single line text
  | 'textarea'       // Multi-line text
  | 'number'         // Numeric input
  | 'decimal'        // Decimal number (for ice depth measurements)
  | 'select'         // Dropdown select
  | 'multiselect'    // Multiple selection
  | 'checkbox'       // Single checkbox (yes/no)
  | 'checkboxGroup'  // Multiple checkboxes
  | 'radio'          // Radio button group
  | 'date'           // Date picker
  | 'time'           // Time picker
  | 'datetime'       // Date and time
  | 'signature'      // Signature capture
  | 'photo'          // Photo upload
  | 'file'           // File upload
  | 'section'        // Section divider
  | 'heading'        // Heading text
  | 'paragraph'      // Static paragraph text
  | 'temperature'    // Temperature input with unit
  | 'measurement'    // Ice depth measurement point

/**
 * Validation rules for form fields
 */
export interface FieldValidation {
  required?: boolean
  min?: number           // Minimum value (number) or length (text)
  max?: number           // Maximum value (number) or length (text)
  minLength?: number     // Minimum string length
  maxLength?: number     // Maximum string length
  pattern?: string       // Regex pattern
  patternMessage?: string // Custom error message for pattern
  customMessage?: string  // Custom required message
}

/**
 * Option for select, radio, checkbox groups
 */
export interface FieldOption {
  label: string
  value: string
  disabled?: boolean
}

/**
 * Conditional logic rule
 */
export interface ConditionalRule {
  field: string          // Field ID to check
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value?: string | number | boolean
  action: 'show' | 'hide' | 'require' | 'disable'
}

/**
 * Form field definition
 */
export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string           // Field name for form data
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean | string[]
  validation?: FieldValidation
  options?: FieldOption[]  // For select, radio, checkbox groups
  conditionalRules?: ConditionalRule[]
  width?: 'full' | 'half' | 'third' | 'quarter'
  readOnly?: boolean
  disabled?: boolean

  // Type-specific properties
  rows?: number          // For textarea
  step?: number          // For number/decimal inputs
  unit?: string          // For measurements (e.g., "inches", "ppm")
  accept?: string        // For file uploads (e.g., "image/*")
  maxFiles?: number      // For multi-file upload
  maxFileSize?: number   // In bytes
}

/**
 * Form section containing fields
 */
export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
  conditionalRules?: ConditionalRule[]
}

/**
 * Complete form schema
 */
export interface FormSchema {
  sections: FormSection[]
  settings?: FormSettings
}

/**
 * Form-level settings
 */
export interface FormSettings {
  showProgressBar?: boolean
  allowDraft?: boolean
  requireSignature?: boolean
  includeTimestamp?: boolean
  includeLocation?: boolean
  includeWeather?: boolean
  submitButtonText?: string
  successMessage?: string
}

/**
 * Form template (stored in database)
 */
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
}

/**
 * Calculated field definition
 */
export interface CalculatedField {
  id: string
  targetField: string    // Field ID to update
  formula: string        // Formula expression (e.g., "AVERAGE(p1, p2, p3)")
  dependencies: string[] // Field IDs this calculation depends on
}

/**
 * Field palette item for drag-and-drop
 */
export interface PaletteItem {
  type: FieldType
  label: string
  icon: string
  category: 'basic' | 'advanced' | 'layout' | 'specialized'
  defaultProps?: Partial<FormField>
}

/**
 * Drag-and-drop context data
 */
export interface DragData {
  type: 'palette' | 'field' | 'section'
  item: PaletteItem | FormField | FormSection
  sourceIndex?: number
  sourceSectionId?: string
}

/**
 * Form submission data
 */
export interface FormSubmissionData {
  [fieldName: string]: string | number | boolean | string[] | null
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: {
    [fieldName: string]: string[]
  }
}
