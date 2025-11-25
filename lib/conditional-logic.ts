import type {
  ConditionalRule,
  ConditionalCondition,
  ConditionalOperator,
  FormData,
} from '@/types/forms'

/**
 * Evaluate a single condition against form data
 */
function evaluateCondition(
  condition: ConditionalCondition,
  formData: FormData
): boolean {
  const fieldValue = formData[condition.fieldId]
  const { operator, value } = condition

  switch (operator) {
    case 'equals':
      return fieldValue === value

    case 'notEquals':
      return fieldValue !== value

    case 'greaterThan':
      return Number(fieldValue) > Number(value)

    case 'lessThan':
      return Number(fieldValue) < Number(value)

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(value)
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value)
      }
      return false

    case 'isEmpty':
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      )

    case 'isNotEmpty':
      return !(
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      )

    default:
      console.warn(`Unknown operator: ${operator}`)
      return false
  }
}

/**
 * Evaluate all conditions in a rule based on logic (AND/OR)
 */
function evaluateRule(rule: ConditionalRule, formData: FormData): boolean {
  const { conditions, conditionLogic } = rule

  if (conditions.length === 0) {
    return false
  }

  const results = conditions.map((condition) =>
    evaluateCondition(condition, formData)
  )

  if (conditionLogic === 'AND') {
    return results.every((result) => result)
  } else {
    // OR
    return results.some((result) => result)
  }
}

/**
 * Get field state based on conditional rules
 */
export interface FieldState {
  visible: boolean
  required: boolean
  enabled: boolean
}

/**
 * Evaluate all conditional rules and return field states
 */
export function evaluateConditionalLogic(
  rules: ConditionalRule[],
  formData: FormData,
  defaultStates: Map<string, FieldState>
): Map<string, FieldState> {
  // Start with default states
  const fieldStates = new Map(defaultStates)

  // Apply each rule
  for (const rule of rules) {
    const ruleMatches = evaluateRule(rule, formData)

    if (ruleMatches) {
      // Apply actions for this rule
      for (const action of rule.actions) {
        const currentState = fieldStates.get(action.targetFieldId) || {
          visible: true,
          required: false,
          enabled: true,
        }

        switch (action.type) {
          case 'show':
            fieldStates.set(action.targetFieldId, {
              ...currentState,
              visible: true,
            })
            break

          case 'hide':
            fieldStates.set(action.targetFieldId, {
              ...currentState,
              visible: false,
            })
            break

          case 'require':
            fieldStates.set(action.targetFieldId, {
              ...currentState,
              required: true,
            })
            break

          case 'unrequire':
            fieldStates.set(action.targetFieldId, {
              ...currentState,
              required: false,
            })
            break

          case 'enable':
            fieldStates.set(action.targetFieldId, {
              ...currentState,
              enabled: true,
            })
            break

          case 'disable':
            fieldStates.set(action.targetFieldId, {
              ...currentState,
              enabled: false,
            })
            break
        }
      }
    }
  }

  return fieldStates
}

/**
 * Get initial field states from schema
 */
export function getInitialFieldStates(
  fields: { id: string; required: boolean }[]
): Map<string, FieldState> {
  const states = new Map<string, FieldState>()

  for (const field of fields) {
    states.set(field.id, {
      visible: true,
      required: field.required,
      enabled: true,
    })
  }

  return states
}
