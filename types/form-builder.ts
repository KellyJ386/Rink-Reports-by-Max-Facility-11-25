/**
 * Form Builder Type Definitions
 * Used for the drag-and-drop form builder in the Admin module
 */

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
  | 'heading'
  | 'paragraph'
  | 'divider'

export interface FieldOption {
  label: string
  value: string
}

export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: string
}

export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean | string[]
  options?: FieldOption[]
  validation?: FieldValidation
  width?: 'full' | 'half' | 'third'
  isLocked?: boolean // Compliance fields can't be deleted
  conditionalLogic?: ConditionalRule
}

export interface ConditionalRule {
  fieldId: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
  value: string | number | boolean
  action: 'show' | 'hide' | 'require'
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  isCollapsible?: boolean
  defaultCollapsed?: boolean
}

export interface FormSchema {
  sections: FormSection[]
  settings?: FormSettings
}

export interface FormSettings {
  showProgressBar?: boolean
  requireSignature?: boolean
  allowDraft?: boolean
  submitButtonText?: string
}

export interface FormTemplateData {
  id?: string
  facilityId: string
  moduleType: string
  name: string
  description?: string
  schema: FormSchema
  conditionalRules?: ConditionalRule[]
  isActive?: boolean
}

// Field definitions for the palette
export interface FieldDefinition {
  type: FieldType
  label: string
  icon: string
  category: 'input' | 'selection' | 'media' | 'layout'
  defaultConfig: Partial<FormField>
}

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // Input fields
  { type: 'text', label: 'Text Input', icon: 'T', category: 'input', defaultConfig: { placeholder: 'Enter text...' } },
  { type: 'textarea', label: 'Text Area', icon: 'Aa', category: 'input', defaultConfig: { placeholder: 'Enter text...' } },
  { type: 'number', label: 'Number', icon: '#', category: 'input', defaultConfig: { placeholder: '0' } },
  { type: 'email', label: 'Email', icon: '@', category: 'input', defaultConfig: { placeholder: 'email@example.com' } },
  { type: 'phone', label: 'Phone', icon: 'Ph', category: 'input', defaultConfig: { placeholder: '(555) 555-5555' } },
  { type: 'date', label: 'Date', icon: 'D', category: 'input', defaultConfig: {} },
  { type: 'time', label: 'Time', icon: 'T', category: 'input', defaultConfig: {} },
  { type: 'datetime', label: 'Date & Time', icon: 'DT', category: 'input', defaultConfig: {} },

  // Selection fields
  { type: 'select', label: 'Dropdown', icon: 'v', category: 'selection', defaultConfig: { options: [{ label: 'Option 1', value: 'option1' }] } },
  { type: 'multiselect', label: 'Multi-Select', icon: '[]', category: 'selection', defaultConfig: { options: [{ label: 'Option 1', value: 'option1' }] } },
  { type: 'checkbox', label: 'Checkbox', icon: '☑', category: 'selection', defaultConfig: {} },
  { type: 'radio', label: 'Radio Group', icon: '◉', category: 'selection', defaultConfig: { options: [{ label: 'Option 1', value: 'option1' }] } },

  // Media fields
  { type: 'signature', label: 'Signature', icon: '✎', category: 'media', defaultConfig: {} },
  { type: 'photo', label: 'Photo Upload', icon: '📷', category: 'media', defaultConfig: {} },

  // Layout fields
  { type: 'heading', label: 'Heading', icon: 'H', category: 'layout', defaultConfig: { label: 'Section Heading' } },
  { type: 'paragraph', label: 'Paragraph', icon: '¶', category: 'layout', defaultConfig: { label: 'Paragraph text...' } },
  { type: 'divider', label: 'Divider', icon: '—', category: 'layout', defaultConfig: {} },
]
