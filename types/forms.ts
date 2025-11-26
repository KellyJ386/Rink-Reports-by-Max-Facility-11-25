// Form field types supported by the form renderer
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'temperature'
  | 'measurement'
  | 'date'
  | 'time'
  | 'datetime'
  | 'dropdown'
  | 'multiselect'
  | 'toggle'
  | 'photo'
  | 'signature'
  | 'bodyDiagram'
  | 'iceDepthGrid'
  | 'sectionHeader'

// Base field configuration
export interface BaseFieldConfig {
  id: string
  type: FieldType
  label: string
  required: boolean
  placeholder?: string
  helpText?: string
  defaultValue?: any
  order: number
}

// Text field configuration
export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text'
  maxLength?: number
  minLength?: number
}

// Textarea field configuration
export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea'
  maxLength?: number
  minLength?: number
  rows?: number
}

// Number field configuration
export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number'
  min?: number
  max?: number
  step?: number
  decimalPlaces?: number
}

// Temperature field configuration (extends number with auto F/C conversion)
export interface TemperatureFieldConfig extends BaseFieldConfig {
  type: 'temperature'
  min?: number
  max?: number
  unit?: 'F' | 'C'
}

// Dropdown field configuration
export interface DropdownFieldConfig extends BaseFieldConfig {
  type: 'dropdown'
  options: string[] | { label: string; value: string }[]
}

// Toggle field configuration
export interface ToggleFieldConfig extends BaseFieldConfig {
  type: 'toggle'
}

// Photo field configuration
export interface PhotoFieldConfig extends BaseFieldConfig {
  type: 'photo'
  maxPhotos?: number // Maximum number of photos allowed (default: 5)
  maxFileSize?: number // Maximum file size in bytes (default: 10MB)
  allowCamera?: boolean // Allow camera capture on mobile (default: true)
}

// Signature field configuration
export interface SignatureFieldConfig extends BaseFieldConfig {
  type: 'signature'
  width?: number // Canvas width in pixels (default: 600)
  height?: number // Canvas height in pixels (default: 200)
}

// Section header (visual divider, not a field)
export interface SectionHeaderConfig extends BaseFieldConfig {
  type: 'sectionHeader'
}

// Type aliases for easier imports
export type PhotoFieldSchema = PhotoFieldConfig
export type SignatureFieldSchema = SignatureFieldConfig

// Union type of all field configurations
export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | NumberFieldConfig
  | TemperatureFieldConfig
  | DropdownFieldConfig
  | ToggleFieldConfig
  | PhotoFieldConfig
  | SignatureFieldConfig
  | SectionHeaderConfig

// Form section containing multiple fields
export interface FormSection {
  id: string
  title: string
  description?: string
  order: number
  fields: FieldConfig[]
}

// Universal header configuration
export interface FormHeader {
  includeUser: boolean
  includeFacility: boolean
  includeRink: boolean
  includeDateTime: boolean
  includeOutsideTemp: boolean
}

// Complete form schema
export interface FormSchema {
  id: string
  name: string
  description?: string
  moduleType: string
  version: number
  header: FormHeader
  sections: FormSection[]
  conditionalRules?: ConditionalRule[]
  calculatedFields?: CalculatedField[]
}

// Conditional logic structures
export type ConditionalOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'contains'
  | 'isEmpty'
  | 'isNotEmpty'

export interface ConditionalCondition {
  fieldId: string
  operator: ConditionalOperator
  value: any
}

export type ConditionalAction = 'show' | 'hide' | 'require' | 'unrequire' | 'enable' | 'disable'

export interface ConditionalRuleAction {
  type: ConditionalAction
  targetFieldId: string
}

export interface ConditionalRule {
  id: string
  conditions: ConditionalCondition[]
  conditionLogic: 'AND' | 'OR'
  actions: ConditionalRuleAction[]
}

// Calculated field structures
export interface CalculatedField {
  id: string
  targetFieldId: string
  formula: string
  locked: boolean
}

// Form data types for submission
export interface FormData {
  [fieldId: string]: any
}

// Universal header data
export interface UniversalHeaderData {
  userId: string
  userName: string
  facilityId: string
  facilityName: string
  rinkId?: string
  rinkName?: string
  submittedAt: Date
  outsideTemp?: number
  outsideTempUnit?: 'F' | 'C'
}

// Complete submission data
export interface SubmissionData {
  header: UniversalHeaderData
  data: FormData
}
