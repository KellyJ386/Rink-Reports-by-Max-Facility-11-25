// Form Builder Types
// These types define the schema structure stored in FormTemplate.schema JSON field

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'signature'
  | 'photo'
  | 'section'
  | 'divider'

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
  name: string // unique identifier for the field within the form
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean | string[]
  options?: SelectOption[] // for select, multiselect, radio
  validation?: ValidationRule[]
  width?: 'full' | 'half' | 'third' // responsive width
  isLocked?: boolean // compliance fields that can't be edited
  isHidden?: boolean // hidden from users but included in data
  order: number // position in form
}

export interface FormSection {
  id: string
  type: 'section'
  title: string
  description?: string
  fields: FormField[]
  isCollapsible?: boolean
  isCollapsed?: boolean
  order: number
}

export interface FormSchema {
  version: number
  fields: (FormField | FormSection)[]
}

// Drag and drop types
export interface DragItem {
  id: string
  type: 'field' | 'section'
  fieldType?: FieldType
}

// Field palette items (available fields to drag)
export interface PaletteItem {
  type: FieldType
  label: string
  icon: string
  category: 'basic' | 'input' | 'selection' | 'media' | 'layout'
}

export const FIELD_PALETTE: PaletteItem[] = [
  // Basic inputs
  { type: 'text', label: 'Text', icon: 'T', category: 'basic' },
  { type: 'textarea', label: 'Text Area', icon: '¶', category: 'basic' },
  { type: 'number', label: 'Number', icon: '#', category: 'basic' },

  // Specialized inputs
  { type: 'email', label: 'Email', icon: '@', category: 'input' },
  { type: 'phone', label: 'Phone', icon: '☎', category: 'input' },
  { type: 'date', label: 'Date', icon: '📅', category: 'input' },
  { type: 'time', label: 'Time', icon: '🕐', category: 'input' },
  { type: 'datetime', label: 'Date & Time', icon: '📆', category: 'input' },

  // Selection
  { type: 'select', label: 'Dropdown', icon: '▼', category: 'selection' },
  { type: 'multiselect', label: 'Multi-Select', icon: '☑', category: 'selection' },
  { type: 'checkbox', label: 'Checkbox', icon: '☐', category: 'selection' },
  { type: 'radio', label: 'Radio Group', icon: '◉', category: 'selection' },
  { type: 'toggle', label: 'Toggle', icon: '◯', category: 'selection' },

  // Media
  { type: 'signature', label: 'Signature', icon: '✍', category: 'media' },
  { type: 'photo', label: 'Photo', icon: '📷', category: 'media' },

  // Layout
  { type: 'section', label: 'Section', icon: '§', category: 'layout' },
  { type: 'divider', label: 'Divider', icon: '—', category: 'layout' },
]

// Default field configurations
export function createDefaultField(type: FieldType, order: number): FormField {
  const base: FormField = {
    id: generateId(),
    type,
    label: getDefaultLabel(type),
    name: `field_${generateId()}`,
    order,
    width: 'full',
  }

  // Add type-specific defaults
  switch (type) {
    case 'select':
    case 'multiselect':
    case 'radio':
      return {
        ...base,
        options: [
          { label: 'Option 1', value: 'option_1' },
          { label: 'Option 2', value: 'option_2' },
        ],
      }
    case 'checkbox':
    case 'toggle':
      return {
        ...base,
        defaultValue: false,
      }
    case 'number':
      return {
        ...base,
        placeholder: '0',
      }
    default:
      return base
  }
}

export function createDefaultSection(order: number): FormSection {
  return {
    id: generateId(),
    type: 'section',
    title: 'New Section',
    fields: [],
    isCollapsible: false,
    order,
  }
}

function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Text Field',
    textarea: 'Text Area',
    number: 'Number Field',
    email: 'Email Address',
    phone: 'Phone Number',
    date: 'Date',
    time: 'Time',
    datetime: 'Date & Time',
    select: 'Dropdown',
    multiselect: 'Multi-Select',
    checkbox: 'Checkbox',
    radio: 'Radio Options',
    toggle: 'Toggle',
    signature: 'Signature',
    photo: 'Photo Upload',
    section: 'Section',
    divider: 'Divider',
  }
  return labels[type]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

// Form Template types for API
export interface FormTemplateInput {
  moduleType: 'ICE_DEPTH' | 'ICE_OPERATIONS' | 'REFRIGERATION' | 'AIR_QUALITY' | 'INCIDENT' | 'SCHEDULE' | 'DAILY_CHECKLIST'
  name: string
  description?: string
  schema: FormSchema
}

export interface FormTemplateResponse {
  id: string
  facilityId: string
  moduleType: string
  name: string
  description: string | null
  version: number
  isActive: boolean
  isLocked: boolean
  schema: FormSchema
  createdAt: string
  updatedAt: string
}
