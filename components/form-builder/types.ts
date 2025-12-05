import { ReactNode } from 'react'

// Field types supported by the form builder
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'select'
  | 'checkbox'
  | 'checkboxGroup'
  | 'radioGroup'
  | 'date'
  | 'time'
  | 'datetime'
  | 'signature'
  | 'photo'
  | 'iceDepthGrid'
  | 'bodyDiagram'
  | 'section'
  | 'weather'
  | 'calculated'
  | 'temperature'
  | 'measurement'

// Field option for select, radio, checkbox groups
export interface FieldOption {
  value: string
  label: string
}

// Validation rules
export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  patternMessage?: string
}

// Conditional rule for showing/hiding fields
export interface ConditionalRule {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value: unknown
  action: 'show' | 'hide' | 'require' | 'disable'
}

// Calculated field configuration
export interface CalculatedFieldConfig {
  operation: 'sum' | 'average' | 'min' | 'max' | 'count' | 'custom'
  sourceFields: string[]
  formula: string
  decimalPlaces: number
}

// Weather field configuration
export interface WeatherFieldConfig {
  autoFetch: boolean
  location?: {
    latitude?: number
    longitude?: number
  }
  units: 'metric' | 'imperial'
  fields: ('temperature' | 'humidity' | 'conditions' | 'wind')[]
}

// Body diagram configuration
export interface BodyDiagramConfig {
  view: 'front' | 'back' | 'both'
  markers: BodyDiagramMarker[]
}

export interface BodyDiagramMarker {
  id: string
  x: number
  y: number
  view: 'front' | 'back'
  label?: string
  severity?: 'minor' | 'moderate' | 'severe'
}

// Base field definition
export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  defaultValue?: unknown
  validation?: FieldValidation
  options?: FieldOption[]
  conditionalRules?: ConditionalRule[]
  // For grid fields
  gridConfig?: {
    columns?: number
    rows?: number
  }
  // For calculated fields
  calculatedConfig?: CalculatedFieldConfig
  // For weather fields
  weatherConfig?: WeatherFieldConfig
  // For body diagram fields
  bodyDiagramConfig?: BodyDiagramConfig
  // For measurement fields
  measurementConfig?: {
    unit: string
    precision: number
  }
  // Generic config for custom field types
  config?: Record<string, unknown>
}

// Form section containing fields
export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

// Complete form schema
export interface FormSchema {
  sections: FormSection[]
}

// Props for field components in edit mode (form builder)
export interface FieldEditProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onUpdate: (field: FormField) => void
  onDelete: () => void
}

// Props for field components in render mode (form submission)
export interface FieldRenderProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
}

// Field component registry entry
export interface FieldTypeConfig {
  type: FieldType
  label: string
  icon: ReactNode
  category: 'basic' | 'choice' | 'date' | 'media' | 'special' | 'layout'
  defaultField: Partial<FormField>
  EditComponent: React.ComponentType<FieldEditProps>
  RenderComponent: React.ComponentType<FieldRenderProps>
}

// Drag and drop types
export interface DragItem {
  id: string
  type: 'field' | 'palette-item'
  fieldType?: FieldType
  sectionId?: string
  index?: number
}

// Form builder state
export interface FormBuilderState {
  schema: FormSchema
  selectedFieldId: string | null
  selectedSectionId: string | null
  isDragging: boolean
}
