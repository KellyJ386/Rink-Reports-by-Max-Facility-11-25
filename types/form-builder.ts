// Form Builder Type Definitions

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
  | 'email'
  | 'phone'
  | 'signature'
  | 'photo'
  | 'section'
  | 'divider'

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

export interface FormField {
  id: string
  type: FieldType
  label: string
  name: string
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean
  options?: FieldOption[]
  validation?: ValidationRule[]
  conditionalRules?: ConditionalRule[]
  width?: 'full' | 'half' | 'third'
  isLocked?: boolean // For compliance fields that can't be edited
  order: number
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface FormSchema {
  sections: FormSection[]
  settings: {
    requireSignature?: boolean
    allowDraft?: boolean
    autoSave?: boolean
    submitButtonText?: string
  }
}

export interface FormTemplateData {
  id?: string
  moduleType: string
  name: string
  description?: string
  schema: FormSchema
  version?: number
  isActive?: boolean
  isLocked?: boolean
}

// Drag and drop types
export interface DragItem {
  type: 'field' | 'section'
  fieldType?: FieldType
  id?: string
  index?: number
  sectionId?: string
}

// Field palette - available fields to drag
export const FIELD_PALETTE: Array<{ type: FieldType; label: string; icon: string }> = [
  { type: 'text', label: 'Text Input', icon: 'T' },
  { type: 'number', label: 'Number', icon: '#' },
  { type: 'textarea', label: 'Text Area', icon: '=' },
  { type: 'select', label: 'Dropdown', icon: 'v' },
  { type: 'checkbox', label: 'Checkbox', icon: '[]' },
  { type: 'radio', label: 'Radio Group', icon: 'O' },
  { type: 'date', label: 'Date', icon: 'D' },
  { type: 'time', label: 'Time', icon: 'T' },
  { type: 'datetime', label: 'Date & Time', icon: 'DT' },
  { type: 'email', label: 'Email', icon: '@' },
  { type: 'phone', label: 'Phone', icon: 'P' },
  { type: 'signature', label: 'Signature', icon: 'S' },
  { type: 'photo', label: 'Photo Upload', icon: 'I' },
  { type: 'section', label: 'Section Header', icon: 'H' },
  { type: 'divider', label: 'Divider', icon: '-' },
]

// Generate unique ID
export function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Create default field based on type
export function createDefaultField(type: FieldType, order: number): FormField {
  const baseField: FormField = {
    id: generateId(),
    type,
    label: getDefaultLabel(type),
    name: `field_${Date.now()}`,
    order,
    width: 'full',
  }

  // Add type-specific defaults
  switch (type) {
    case 'select':
    case 'radio':
      baseField.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ]
      break
    case 'checkbox':
      baseField.defaultValue = false
      break
    case 'number':
      baseField.placeholder = '0'
      break
  }

  return baseField
}

function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Text Field',
    number: 'Number Field',
    textarea: 'Text Area',
    select: 'Select Field',
    checkbox: 'Checkbox',
    radio: 'Radio Group',
    date: 'Date',
    time: 'Time',
    datetime: 'Date & Time',
    email: 'Email',
    phone: 'Phone Number',
    signature: 'Signature',
    photo: 'Photo',
    section: 'Section Title',
    divider: '',
  }
  return labels[type]
}

// Create default section
export function createDefaultSection(order: number): FormSection {
  return {
    id: generateId(),
    title: 'New Section',
    fields: [],
    order,
  }
}
