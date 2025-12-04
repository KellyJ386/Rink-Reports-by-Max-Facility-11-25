import { FormField, FormSubmissionData, ConditionalRule, CalculatedField } from '@/types/forms'

/**
 * Evaluate a single conditional rule
 */
export function evaluateCondition(
  rule: ConditionalRule,
  formData: FormSubmissionData
): boolean {
  const fieldValue = formData[rule.field]

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value

    case 'notEquals':
      return fieldValue !== rule.value

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(rule.value))
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value)
      }
      return false

    case 'greaterThan':
      return typeof fieldValue === 'number' && fieldValue > Number(rule.value)

    case 'lessThan':
      return typeof fieldValue === 'number' && fieldValue < Number(rule.value)

    case 'isEmpty':
      return fieldValue === null ||
             fieldValue === undefined ||
             fieldValue === '' ||
             (Array.isArray(fieldValue) && fieldValue.length === 0)

    case 'isNotEmpty':
      return fieldValue !== null &&
             fieldValue !== undefined &&
             fieldValue !== '' &&
             !(Array.isArray(fieldValue) && fieldValue.length === 0)

    default:
      return true
  }
}

/**
 * Determine if a field should be visible based on conditional rules
 */
export function isFieldVisible(
  field: FormField,
  formData: FormSubmissionData
): boolean {
  if (!field.conditionalRules || field.conditionalRules.length === 0) {
    return true
  }

  for (const rule of field.conditionalRules) {
    const conditionMet = evaluateCondition(rule, formData)

    if (rule.action === 'hide' && conditionMet) {
      return false
    }
    if (rule.action === 'show' && !conditionMet) {
      return false
    }
  }

  return true
}

/**
 * Determine if a field should be required based on conditional rules
 */
export function isFieldRequired(
  field: FormField,
  formData: FormSubmissionData
): boolean {
  // Base requirement from validation
  let required = field.validation?.required || false

  if (!field.conditionalRules) {
    return required
  }

  for (const rule of field.conditionalRules) {
    if (rule.action === 'require') {
      const conditionMet = evaluateCondition(rule, formData)
      if (conditionMet) {
        required = true
      }
    }
  }

  return required
}

/**
 * Determine if a field should be disabled based on conditional rules
 */
export function isFieldDisabled(
  field: FormField,
  formData: FormSubmissionData
): boolean {
  if (field.disabled) {
    return true
  }

  if (!field.conditionalRules) {
    return false
  }

  for (const rule of field.conditionalRules) {
    if (rule.action === 'disable') {
      const conditionMet = evaluateCondition(rule, formData)
      if (conditionMet) {
        return true
      }
    }
  }

  return false
}

/**
 * Parse and evaluate a formula expression
 * Supports: AVERAGE, SUM, MIN, MAX, COUNT, IF, AND, OR
 */
export function evaluateFormula(
  formula: string,
  formData: FormSubmissionData
): number | string | null {
  try {
    // Replace field references with actual values
    let expression = formula

    // Extract field names from formula (e.g., {fieldName})
    const fieldPattern = /\{([^}]+)\}/g
    let match
    while ((match = fieldPattern.exec(formula)) !== null) {
      const fieldName = match[1]
      const value = formData[fieldName]
      if (typeof value === 'number') {
        expression = expression.replace(match[0], String(value))
      } else if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        expression = expression.replace(match[0], value)
      } else {
        expression = expression.replace(match[0], '0')
      }
    }

    // Handle AVERAGE function
    const avgMatch = expression.match(/AVERAGE\(([^)]+)\)/i)
    if (avgMatch) {
      const args = avgMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      if (args.length > 0) {
        const avg = args.reduce((a, b) => a + b, 0) / args.length
        expression = expression.replace(avgMatch[0], String(avg))
      }
    }

    // Handle SUM function
    const sumMatch = expression.match(/SUM\(([^)]+)\)/i)
    if (sumMatch) {
      const args = sumMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      const sum = args.reduce((a, b) => a + b, 0)
      expression = expression.replace(sumMatch[0], String(sum))
    }

    // Handle MIN function
    const minMatch = expression.match(/MIN\(([^)]+)\)/i)
    if (minMatch) {
      const args = minMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      if (args.length > 0) {
        const min = Math.min(...args)
        expression = expression.replace(minMatch[0], String(min))
      }
    }

    // Handle MAX function
    const maxMatch = expression.match(/MAX\(([^)]+)\)/i)
    if (maxMatch) {
      const args = maxMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      if (args.length > 0) {
        const max = Math.max(...args)
        expression = expression.replace(maxMatch[0], String(max))
      }
    }

    // Handle COUNT function
    const countMatch = expression.match(/COUNT\(([^)]+)\)/i)
    if (countMatch) {
      const args = countMatch[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      expression = expression.replace(countMatch[0], String(args.length))
    }

    // Handle ROUND function
    const roundMatch = expression.match(/ROUND\(([^,]+),\s*(\d+)\)/i)
    if (roundMatch) {
      const value = parseFloat(roundMatch[1])
      const decimals = parseInt(roundMatch[2])
      if (!isNaN(value)) {
        const rounded = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
        expression = expression.replace(roundMatch[0], String(rounded))
      }
    }

    // Evaluate simple arithmetic expressions
    // Only allow numbers, operators, parentheses, and spaces
    if (/^[\d\s+\-*/().]+$/.test(expression)) {
      // Safe eval for simple math
      const result = Function('"use strict"; return (' + expression + ')')()
      return typeof result === 'number' && !isNaN(result) ? result : null
    }

    return null
  } catch (error) {
    console.error('Formula evaluation error:', error)
    return null
  }
}

/**
 * Calculate all calculated fields and return updated form data
 */
export function calculateFields(
  calculatedFields: CalculatedField[],
  formData: FormSubmissionData
): FormSubmissionData {
  const updatedData = { ...formData }

  // Sort by dependencies to ensure correct calculation order
  const sorted = topologicalSort(calculatedFields)

  for (const calcField of sorted) {
    const result = evaluateFormula(calcField.formula, updatedData)
    if (result !== null) {
      updatedData[calcField.targetField] = result
    }
  }

  return updatedData
}

/**
 * Topological sort for calculated fields based on dependencies
 */
function topologicalSort(fields: CalculatedField[]): CalculatedField[] {
  const visited = new Set<string>()
  const result: CalculatedField[] = []

  function visit(field: CalculatedField) {
    if (visited.has(field.id)) return
    visited.add(field.id)

    // Visit dependencies first
    for (const dep of field.dependencies) {
      const depField = fields.find(f => f.targetField === dep)
      if (depField) {
        visit(depField)
      }
    }

    result.push(field)
  }

  for (const field of fields) {
    visit(field)
  }

  return result
}

/**
 * Check if a value exceeds a threshold
 */
export function checkThreshold(
  value: number,
  warningThreshold: number,
  criticalThreshold: number
): 'normal' | 'warning' | 'critical' {
  if (value >= criticalThreshold) {
    return 'critical'
  }
  if (value >= warningThreshold) {
    return 'warning'
  }
  return 'normal'
}

/**
 * Air quality threshold checker
 */
export interface AirQualityThresholds {
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
}

export function checkAirQuality(
  coReading: number,
  no2Reading: number,
  thresholds: AirQualityThresholds
): {
  co: 'normal' | 'warning' | 'critical'
  no2: 'normal' | 'warning' | 'critical'
  overall: 'normal' | 'warning' | 'critical'
  requiresEvacuation: boolean
} {
  const coStatus = checkThreshold(coReading, thresholds.coWarningPpm, thresholds.coEvacuationPpm)
  const no2Status = checkThreshold(no2Reading, thresholds.no2WarningPpm, thresholds.no2EvacuationPpm)

  const requiresEvacuation = coStatus === 'critical' || no2Status === 'critical'

  let overall: 'normal' | 'warning' | 'critical' = 'normal'
  if (coStatus === 'critical' || no2Status === 'critical') {
    overall = 'critical'
  } else if (coStatus === 'warning' || no2Status === 'warning') {
    overall = 'warning'
  }

  return { co: coStatus, no2: no2Status, overall, requiresEvacuation }
}
