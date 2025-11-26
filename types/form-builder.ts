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
  // Phase 3: Specialized fields
  | 'ice_depth_grid'
  | 'body_diagram'
  | 'calculated'

export interface SelectOption {
  label: string
  value: string
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  value?: string | number | boolean
  message: string
}

// ==================== CONDITIONAL LOGIC ====================

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equals'
  | 'less_than_or_equals'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_true'
  | 'is_false'

export interface ConditionalRule {
  id: string
  sourceFieldId: string // The field to check
  operator: ConditionalOperator
  value?: string | number | boolean // The value to compare against
}

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require' | 'disable'
  logicType: 'all' | 'any' // AND vs OR for multiple conditions
  conditions: ConditionalRule[]
}

// ==================== CALCULATED FIELDS ====================

export type CalculationOperator = '+' | '-' | '*' | '/' | 'min' | 'max' | 'avg' | 'sum' | 'count'

export interface CalculationStep {
  type: 'field' | 'constant' | 'operator' | 'function'
  value: string | number // field ID, constant value, operator, or function name
}

export interface CalculatedFieldConfig {
  formula: CalculationStep[] // Postfix notation for calculation
  decimalPlaces?: number
  prefix?: string // e.g., "$"
  suffix?: string // e.g., "inches"
  fallbackValue?: number // Value when calculation fails
}

// ==================== SPECIALIZED FIELDS ====================

// Ice Depth Grid Configuration
export interface IceDepthPoint {
  id: string
  x: number // percentage from left (0-100)
  y: number // percentage from top (0-100)
  label: string // e.g., "A1", "Center", "Goal Crease"
}

export interface IceDepthGridConfig {
  preset: 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM'
  points: IceDepthPoint[]
  minValue?: number // minimum acceptable depth
  maxValue?: number // maximum acceptable depth
  targetValue?: number // ideal depth
  unit: 'inches' | 'mm'
  showRinkOutline: boolean
}

// Body Diagram Configuration (for incident reporting)
export interface BodyDiagramConfig {
  view: 'front' | 'back' | 'both'
  allowMultipleMarkers: boolean
  markerTypes: BodyMarkerType[]
}

export interface BodyMarkerType {
  id: string
  label: string
  color: string
  icon?: string
}

export interface BodyMarker {
  id: string
  typeId: string
  x: number
  y: number
  view: 'front' | 'back'
  notes?: string
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

  // Phase 3: Conditional Logic
  conditionalLogic?: ConditionalLogic

  // Phase 3: Calculated Fields
  calculatedConfig?: CalculatedFieldConfig

  // Phase 3: Specialized Field Configs
  iceDepthGridConfig?: IceDepthGridConfig
  bodyDiagramConfig?: BodyDiagramConfig
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
  category: 'basic' | 'input' | 'selection' | 'media' | 'layout' | 'specialized' | 'advanced'
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

  // Phase 3: Specialized fields
  { type: 'ice_depth_grid', label: 'Ice Depth Grid', icon: '❄', category: 'specialized' },
  { type: 'body_diagram', label: 'Body Diagram', icon: '🧍', category: 'specialized' },

  // Phase 3: Advanced
  { type: 'calculated', label: 'Calculated', icon: 'ƒ', category: 'advanced' },
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
    case 'ice_depth_grid':
      return {
        ...base,
        iceDepthGridConfig: {
          preset: 'RINK_25',
          points: getDefaultIceDepthPoints('RINK_25'),
          minValue: 0.75,
          maxValue: 1.25,
          targetValue: 1.0,
          unit: 'inches',
          showRinkOutline: true,
        },
      }
    case 'body_diagram':
      return {
        ...base,
        bodyDiagramConfig: {
          view: 'front',
          allowMultipleMarkers: true,
          markerTypes: [
            { id: 'injury', label: 'Injury', color: '#ef4444' },
            { id: 'pain', label: 'Pain', color: '#f97316' },
            { id: 'bruise', label: 'Bruise', color: '#8b5cf6' },
          ],
        },
      }
    case 'calculated':
      return {
        ...base,
        calculatedConfig: {
          formula: [],
          decimalPlaces: 2,
          fallbackValue: 0,
        },
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
    ice_depth_grid: 'Ice Depth Grid',
    body_diagram: 'Body Diagram',
    calculated: 'Calculated Field',
  }
  return labels[type]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

// ==================== ICE DEPTH PRESETS ====================

export function getDefaultIceDepthPoints(preset: IceDepthGridConfig['preset']): IceDepthPoint[] {
  // Standard NHL rink measurement points
  switch (preset) {
    case 'RINK_25':
      return generate25PointGrid()
    case 'RINK_35':
      return generate35PointGrid()
    case 'RINK_47':
      return generate47PointGrid()
    case 'CUSTOM':
    default:
      return []
  }
}

function generate25PointGrid(): IceDepthPoint[] {
  // 5x5 grid for basic ice depth measurement
  const points: IceDepthPoint[] = []
  const rows = ['A', 'B', 'C', 'D', 'E']
  const cols = [1, 2, 3, 4, 5]

  rows.forEach((row, rowIndex) => {
    cols.forEach((col, colIndex) => {
      points.push({
        id: `${row}${col}`,
        x: 10 + colIndex * 20,
        y: 10 + rowIndex * 20,
        label: `${row}${col}`,
      })
    })
  })

  return points
}

function generate35PointGrid(): IceDepthPoint[] {
  // 7x5 grid for more detailed measurement
  const points: IceDepthPoint[] = []
  const rows = ['A', 'B', 'C', 'D', 'E']
  const cols = [1, 2, 3, 4, 5, 6, 7]

  rows.forEach((row, rowIndex) => {
    cols.forEach((col, colIndex) => {
      points.push({
        id: `${row}${col}`,
        x: 7 + colIndex * 14,
        y: 10 + rowIndex * 20,
        label: `${row}${col}`,
      })
    })
  })

  return points
}

function generate47PointGrid(): IceDepthPoint[] {
  // Comprehensive measurement including goal areas and center ice
  const points: IceDepthPoint[] = []

  // Main 5x7 grid
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const cols = [1, 2, 3, 4, 5, 6, 7]

  rows.forEach((row, rowIndex) => {
    cols.forEach((col, colIndex) => {
      points.push({
        id: `${row}${col}`,
        x: 7 + colIndex * 14,
        y: 7 + rowIndex * 14,
        label: `${row}${col}`,
      })
    })
  })

  // Add special points for goal creases
  points.push(
    { id: 'GL1', x: 5, y: 50, label: 'Goal L' },
    { id: 'GR1', x: 95, y: 50, label: 'Goal R' },
    { id: 'CTR', x: 50, y: 50, label: 'Center' }
  )

  return points
}

// ==================== CONDITIONAL LOGIC EVALUATION ====================

export function evaluateCondition(
  condition: ConditionalRule,
  formValues: Record<string, any>
): boolean {
  const sourceValue = formValues[condition.sourceFieldId]

  switch (condition.operator) {
    case 'equals':
      return sourceValue === condition.value
    case 'not_equals':
      return sourceValue !== condition.value
    case 'contains':
      return String(sourceValue).includes(String(condition.value))
    case 'not_contains':
      return !String(sourceValue).includes(String(condition.value))
    case 'greater_than':
      return Number(sourceValue) > Number(condition.value)
    case 'less_than':
      return Number(sourceValue) < Number(condition.value)
    case 'greater_than_or_equals':
      return Number(sourceValue) >= Number(condition.value)
    case 'less_than_or_equals':
      return Number(sourceValue) <= Number(condition.value)
    case 'is_empty':
      return sourceValue === undefined || sourceValue === null || sourceValue === ''
    case 'is_not_empty':
      return sourceValue !== undefined && sourceValue !== null && sourceValue !== ''
    case 'is_true':
      return sourceValue === true
    case 'is_false':
      return sourceValue === false
    default:
      return false
  }
}

export function evaluateConditionalLogic(
  logic: ConditionalLogic,
  formValues: Record<string, any>
): boolean {
  if (!logic.conditions.length) return true

  const results = logic.conditions.map((condition) =>
    evaluateCondition(condition, formValues)
  )

  return logic.logicType === 'all'
    ? results.every((r) => r)
    : results.some((r) => r)
}

export function shouldShowField(
  field: FormField,
  formValues: Record<string, any>
): boolean {
  if (!field.conditionalLogic) return true

  const conditionMet = evaluateConditionalLogic(field.conditionalLogic, formValues)

  switch (field.conditionalLogic.action) {
    case 'show':
      return conditionMet
    case 'hide':
      return !conditionMet
    default:
      return true
  }
}

// ==================== CALCULATED FIELD EVALUATION ====================

export function evaluateCalculatedField(
  config: CalculatedFieldConfig,
  formValues: Record<string, any>,
  allFields: FormField[]
): number {
  if (!config.formula.length) {
    return config.fallbackValue ?? 0
  }

  try {
    const stack: number[] = []

    for (const step of config.formula) {
      switch (step.type) {
        case 'field': {
          const fieldId = String(step.value)
          const field = allFields.find((f) => f.id === fieldId)
          if (field) {
            const value = Number(formValues[field.name]) || 0
            stack.push(value)
          } else {
            stack.push(0)
          }
          break
        }
        case 'constant':
          stack.push(Number(step.value))
          break
        case 'operator': {
          const op = step.value as CalculationOperator
          if (['+', '-', '*', '/'].includes(op)) {
            const b = stack.pop() ?? 0
            const a = stack.pop() ?? 0
            switch (op) {
              case '+':
                stack.push(a + b)
                break
              case '-':
                stack.push(a - b)
                break
              case '*':
                stack.push(a * b)
                break
              case '/':
                stack.push(b !== 0 ? a / b : 0)
                break
            }
          }
          break
        }
        case 'function': {
          const fn = step.value as string
          // Collect all values in stack for aggregate functions
          const values = [...stack]
          stack.length = 0
          switch (fn) {
            case 'sum':
              stack.push(values.reduce((a, b) => a + b, 0))
              break
            case 'avg':
              stack.push(values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0)
              break
            case 'min':
              stack.push(Math.min(...values))
              break
            case 'max':
              stack.push(Math.max(...values))
              break
            case 'count':
              stack.push(values.length)
              break
          }
          break
        }
      }
    }

    const result = stack.pop() ?? config.fallbackValue ?? 0
    return Number(result.toFixed(config.decimalPlaces ?? 2))
  } catch {
    return config.fallbackValue ?? 0
  }
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
