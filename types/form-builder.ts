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
  | 'iceDepthGrid'
  | 'bodyDiagram'

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
export const FIELD_PALETTE: Array<{ type: FieldType; label: string; icon: string; category?: string }> = [
  // Basic fields
  { type: 'text', label: 'Text Input', icon: 'T', category: 'basic' },
  { type: 'number', label: 'Number', icon: '#', category: 'basic' },
  { type: 'textarea', label: 'Text Area', icon: '=', category: 'basic' },
  { type: 'select', label: 'Dropdown', icon: 'v', category: 'basic' },
  { type: 'checkbox', label: 'Checkbox', icon: '[]', category: 'basic' },
  { type: 'radio', label: 'Radio Group', icon: 'O', category: 'basic' },
  { type: 'date', label: 'Date', icon: 'D', category: 'basic' },
  { type: 'time', label: 'Time', icon: 'T', category: 'basic' },
  { type: 'datetime', label: 'Date & Time', icon: 'DT', category: 'basic' },
  { type: 'email', label: 'Email', icon: '@', category: 'basic' },
  { type: 'phone', label: 'Phone', icon: 'P', category: 'basic' },
  // Media fields
  { type: 'signature', label: 'Signature', icon: 'S', category: 'media' },
  { type: 'photo', label: 'Photo Upload', icon: 'I', category: 'media' },
  // Specialized fields
  { type: 'iceDepthGrid', label: 'Ice Depth Grid', icon: '❄', category: 'specialized' },
  { type: 'bodyDiagram', label: 'Body Diagram', icon: '👤', category: 'specialized' },
  // Layout fields
  { type: 'section', label: 'Section Header', icon: 'H', category: 'layout' },
  { type: 'divider', label: 'Divider', icon: '-', category: 'layout' },
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
    iceDepthGrid: 'Ice Depth Measurements',
    bodyDiagram: 'Injury Diagram',
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
