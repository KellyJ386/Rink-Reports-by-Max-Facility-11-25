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
  // Phase 3: Advanced field types
  | 'calculated'
  | 'iceDepthGrid'
  | 'bodyDiagram'
  | 'temperature'

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

// Phase 3: Calculated field configuration
export interface CalculatedFieldConfig {
  formula: string // e.g., "field1 + field2", "avg(field1, field2, field3)"
  operation: 'sum' | 'average' | 'min' | 'max' | 'count' | 'custom'
  sourceFields: string[] // field names to use in calculation
  decimalPlaces?: number
  prefix?: string // e.g., "$"
  suffix?: string // e.g., "°F"
}

// Phase 3: Ice Depth Grid configuration
export interface IceDepthGridConfig {
  preset: '25' | '35' | '47' | 'custom'
  points: IceDepthPoint[]
  targetDepth?: number
  warningThreshold?: number
  unit: 'inches' | 'mm'
}

export interface IceDepthPoint {
  id: string
  x: number // percentage position
  y: number
  label: string
}

// Phase 3: Body Diagram configuration
export interface BodyDiagramConfig {
  view: 'front' | 'back' | 'both'
  allowMultiple: boolean
  injuryTypes: string[]
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
  // Phase 3: Advanced field configs
  calculatedConfig?: CalculatedFieldConfig
  iceDepthConfig?: IceDepthGridConfig
  bodyDiagramConfig?: BodyDiagramConfig
  temperatureUnit?: 'F' | 'C'
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
  category: 'input' | 'selection' | 'media' | 'layout' | 'specialized' | 'calculated'
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
  { type: 'temperature', label: 'Temperature', icon: '°', category: 'input', defaultConfig: { temperatureUnit: 'F', placeholder: '0' } },

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

  // Specialized fields (Phase 3)
  { type: 'iceDepthGrid', label: 'Ice Depth Grid', icon: '❄', category: 'specialized', defaultConfig: {
    iceDepthConfig: { preset: '25', points: [], unit: 'inches' }
  }},
  { type: 'bodyDiagram', label: 'Body Diagram', icon: '🧍', category: 'specialized', defaultConfig: {
    bodyDiagramConfig: { view: 'front', allowMultiple: true, injuryTypes: ['bruise', 'cut', 'sprain', 'fracture', 'other'] }
  }},

  // Calculated fields (Phase 3)
  { type: 'calculated', label: 'Calculated', icon: 'fx', category: 'calculated', defaultConfig: {
    calculatedConfig: { operation: 'sum', sourceFields: [], decimalPlaces: 2, formula: '' }
  }},
]

// Phase 3: Form version tracking
export interface FormVersion {
  version: number
  createdAt: string
  createdBy: string
  changes: string
  schema: FormSchema
}

// Phase 3: Helper function to evaluate conditional logic
export function evaluateCondition(
  rule: ConditionalRule,
  formData: Record<string, unknown>
): boolean {
  const fieldValue = formData[rule.fieldId]

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value
    case 'notEquals':
      return fieldValue !== rule.value
    case 'contains':
      return String(fieldValue).includes(String(rule.value))
    case 'greaterThan':
      return Number(fieldValue) > Number(rule.value)
    case 'lessThan':
      return Number(fieldValue) < Number(rule.value)
    default:
      return true
  }
}

// Phase 3: Helper function to calculate field values
export function calculateFieldValue(
  config: CalculatedFieldConfig,
  formData: Record<string, unknown>
): number | string {
  const values = config.sourceFields
    .map(fieldName => formData[fieldName])
    .filter(v => v !== undefined && v !== null && v !== '')
    .map(v => Number(v))
    .filter(v => !isNaN(v))

  if (values.length === 0) return ''

  let result: number
  switch (config.operation) {
    case 'sum':
      result = values.reduce((a, b) => a + b, 0)
      break
    case 'average':
      result = values.reduce((a, b) => a + b, 0) / values.length
      break
    case 'min':
      result = Math.min(...values)
      break
    case 'max':
      result = Math.max(...values)
      break
    case 'count':
      result = values.length
      break
    default:
      result = 0
  }

  const rounded = config.decimalPlaces !== undefined
    ? Number(result.toFixed(config.decimalPlaces))
    : result

  const prefix = config.prefix || ''
  const suffix = config.suffix || ''

  return `${prefix}${rounded}${suffix}`
}
