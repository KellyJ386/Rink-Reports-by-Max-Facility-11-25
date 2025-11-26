// Form Builder Type Definitions

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'textarea'
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
  | 'section'
  | 'ice-depth-grid'
  | 'body-diagram'

export interface FieldOption {
  label: string
  value: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: string | number
  message: string
}

export interface ConditionalRule {
  fieldId: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value?: string | number | boolean
  action: 'show' | 'hide' | 'require' | 'disable'
}

export interface BaseFieldConfig {
  id: string
  type: FieldType
  label: string
  description?: string
  placeholder?: string
  defaultValue?: unknown
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  validation?: ValidationRule[]
  conditionalRules?: ConditionalRule[]
  width?: 'full' | 'half' | 'third' | 'quarter'
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text' | 'email' | 'phone'
  maxLength?: number
  minLength?: number
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number'
  min?: number
  max?: number
  step?: number
  unit?: string
}

export interface TextAreaFieldConfig extends BaseFieldConfig {
  type: 'textarea'
  rows?: number
  maxLength?: number
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select' | 'multiselect' | 'radio'
  options: FieldOption[]
  allowOther?: boolean
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox'
  checkboxLabel?: string
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date' | 'time' | 'datetime'
  minDate?: string
  maxDate?: string
}

export interface SignatureFieldConfig extends BaseFieldConfig {
  type: 'signature'
}

export interface PhotoFieldConfig extends BaseFieldConfig {
  type: 'photo'
  maxFiles?: number
  maxSizeMB?: number
  allowCamera?: boolean
}

export interface FileFieldConfig extends BaseFieldConfig {
  type: 'file'
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
}

export interface SectionFieldConfig extends BaseFieldConfig {
  type: 'section'
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface IceDepthGridConfig extends BaseFieldConfig {
  type: 'ice-depth-grid'
  presetType?: 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM'
  measurementPoints?: Array<{ id: string; x: number; y: number; label: string }>
}

export interface BodyDiagramConfig extends BaseFieldConfig {
  type: 'body-diagram'
  allowMultipleMarkers?: boolean
}

export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | TextAreaFieldConfig
  | SelectFieldConfig
  | CheckboxFieldConfig
  | DateFieldConfig
  | SignatureFieldConfig
  | PhotoFieldConfig
  | FileFieldConfig
  | SectionFieldConfig
  | IceDepthGridConfig
  | BodyDiagramConfig

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FieldConfig[]
}

export interface FormSchema {
  id: string
  version: number
  name: string
  description?: string
  sections: FormSection[]
  settings?: {
    showProgressBar?: boolean
    allowSaveDraft?: boolean
    requireSignature?: boolean
    autoSaveInterval?: number
  }
}

export interface FormFieldProps<T = unknown> {
  config: FieldConfig
  value: T
  onChange: (value: T) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
}
