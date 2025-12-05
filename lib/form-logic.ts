import { ConditionalRule, CalculatedField, FormField } from '@/types'

/**
 * Evaluates a single conditional rule against form data
 */
export function evaluateCondition(
  rule: ConditionalRule,
  formData: Record<string, unknown>
): boolean {
  const sourceValue = formData[rule.sourceFieldId]

  switch (rule.operator) {
    case 'equals':
      return sourceValue === rule.value

    case 'notEquals':
      return sourceValue !== rule.value

    case 'contains':
      if (typeof sourceValue === 'string' && typeof rule.value === 'string') {
        return sourceValue.toLowerCase().includes(rule.value.toLowerCase())
      }
      if (Array.isArray(sourceValue)) {
        return sourceValue.includes(rule.value)
      }
      return false

    case 'greaterThan':
      if (typeof sourceValue === 'number' && typeof rule.value === 'number') {
        return sourceValue > rule.value
      }
      return false

    case 'lessThan':
      if (typeof sourceValue === 'number' && typeof rule.value === 'number') {
        return sourceValue < rule.value
      }
      return false

    case 'isEmpty':
      return (
        sourceValue === undefined ||
        sourceValue === null ||
        sourceValue === '' ||
        (Array.isArray(sourceValue) && sourceValue.length === 0)
      )

    case 'isNotEmpty':
      return !(
        sourceValue === undefined ||
        sourceValue === null ||
        sourceValue === '' ||
        (Array.isArray(sourceValue) && sourceValue.length === 0)
      )

    default:
      return true
  }
}

/**
 * Evaluates all conditional rules and returns field states
 */
export function evaluateAllConditions(
  rules: ConditionalRule[],
  formData: Record<string, unknown>,
  fields: FormField[]
): Record<string, { hidden: boolean; disabled: boolean; required: boolean }> {
  // Initialize default states from field configs
  const fieldStates: Record<string, { hidden: boolean; disabled: boolean; required: boolean }> = {}

  fields.forEach((field) => {
    fieldStates[field.id] = {
      hidden: field.hidden || false,
      disabled: field.disabled || false,
      required: field.required || false,
    }
  })

  // Apply conditional rules
  rules.forEach((rule) => {
    const conditionMet = evaluateCondition(rule, formData)
    const targetState = fieldStates[rule.targetFieldId]

    if (!targetState) return

    switch (rule.action) {
      case 'show':
        // Show when condition is met, hide otherwise
        if (!conditionMet) {
          targetState.hidden = true
        }
        break

      case 'hide':
        // Hide when condition is met
        if (conditionMet) {
          targetState.hidden = true
        }
        break

      case 'require':
        // Require when condition is met
        if (conditionMet) {
          targetState.required = true
        }
        break

      case 'disable':
        // Disable when condition is met
        if (conditionMet) {
          targetState.disabled = true
        }
        break
    }
  })

  return fieldStates
}

/**
 * Supported calculation functions
 */
const calculationFunctions: Record<string, (...args: number[]) => number> = {
  sum: (...args) => args.reduce((a, b) => a + b, 0),
  average: (...args) => args.length > 0 ? args.reduce((a, b) => a + b, 0) / args.length : 0,
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  count: (...args) => args.filter(a => a !== undefined && a !== null).length,
  abs: (a) => Math.abs(a),
  round: (a, decimals = 0) => {
    const factor = Math.pow(10, decimals)
    return Math.round(a * factor) / factor
  },
}

/**
 * Safely evaluates a calculation formula
 */
export function evaluateFormula(
  formula: string,
  formData: Record<string, unknown>,
  sourceFieldIds: string[]
): number | null {
  try {
    // Replace field references with values
    let expression = formula

    // Replace field IDs with their values
    sourceFieldIds.forEach((fieldId) => {
      const value = formData[fieldId]
      const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
      expression = expression.replace(new RegExp(fieldId, 'g'), String(numValue))
    })

    // Replace function calls with their results
    Object.entries(calculationFunctions).forEach(([funcName, func]) => {
      const regex = new RegExp(`${funcName}\\(([^)]+)\\)`, 'gi')
      expression = expression.replace(regex, (match, args) => {
        const values = args.split(',').map((arg: string) => parseFloat(arg.trim()) || 0)
        return String(func(...values))
      })
    })

    // Evaluate the expression (basic math only)
    // Only allow numbers, basic operators, parentheses, and whitespace
    if (!/^[\d\s+\-*/().]+$/.test(expression)) {
      console.warn('Invalid formula expression:', expression)
      return null
    }

    // Use Function constructor for safe evaluation
    const result = new Function(`return ${expression}`)()
    return typeof result === 'number' && !isNaN(result) ? result : null
  } catch (error) {
    console.error('Formula evaluation error:', error)
    return null
  }
}

/**
 * Evaluates all calculated fields and returns updated form data
 */
export function evaluateCalculatedFields(
  calculatedFields: CalculatedField[],
  formData: Record<string, unknown>
): Record<string, unknown> {
  const updatedData = { ...formData }

  calculatedFields.forEach((calc) => {
    const result = evaluateFormula(calc.formula, formData, calc.sourceFieldIds)
    if (result !== null) {
      updatedData[calc.targetFieldId] = result
    }
  })

  return updatedData
}

/**
 * Gets available operators based on field type
 */
export function getOperatorsForFieldType(fieldType: string): { value: string; label: string }[] {
  const baseOperators = [
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ]

  switch (fieldType) {
    case 'number':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not equals' },
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'lessThan', label: 'Less than' },
        ...baseOperators,
      ]

    case 'text':
    case 'textarea':
    case 'email':
    case 'phone':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not equals' },
        { value: 'contains', label: 'Contains' },
        ...baseOperators,
      ]

    case 'select':
    case 'radio':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not equals' },
        ...baseOperators,
      ]

    case 'multiselect':
    case 'checkbox':
      return [
        { value: 'contains', label: 'Contains' },
        ...baseOperators,
      ]

    case 'date':
    case 'time':
    case 'datetime':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not equals' },
        ...baseOperators,
      ]

    default:
      return baseOperators
  }
}
