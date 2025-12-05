import {
  evaluateCondition,
  evaluateAllConditions,
  evaluateFormula,
  evaluateCalculatedFields,
  getOperatorsForFieldType,
} from '@/lib/form-logic'
import { ConditionalRule, CalculatedField, FormField } from '@/types'

describe('form-logic', () => {
  describe('evaluateCondition', () => {
    it('should evaluate equals operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'equals',
        value: 'test',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 'test' })).toBe(true)
      expect(evaluateCondition(rule, { field1: 'other' })).toBe(false)
    })

    it('should evaluate notEquals operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'notEquals',
        value: 'test',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 'other' })).toBe(true)
      expect(evaluateCondition(rule, { field1: 'test' })).toBe(false)
    })

    it('should evaluate contains operator for strings', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'contains',
        value: 'test',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 'this is a test' })).toBe(true)
      expect(evaluateCondition(rule, { field1: 'TEST CASE' })).toBe(true) // case insensitive
      expect(evaluateCondition(rule, { field1: 'no match' })).toBe(false)
    })

    it('should evaluate contains operator for arrays', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'contains',
        value: 'item2',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: ['item1', 'item2', 'item3'] })).toBe(true)
      expect(evaluateCondition(rule, { field1: ['item1', 'item3'] })).toBe(false)
    })

    it('should evaluate greaterThan operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'greaterThan',
        value: 10,
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 15 })).toBe(true)
      expect(evaluateCondition(rule, { field1: 10 })).toBe(false)
      expect(evaluateCondition(rule, { field1: 5 })).toBe(false)
    })

    it('should evaluate lessThan operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'lessThan',
        value: 10,
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 5 })).toBe(true)
      expect(evaluateCondition(rule, { field1: 10 })).toBe(false)
      expect(evaluateCondition(rule, { field1: 15 })).toBe(false)
    })

    it('should evaluate isEmpty operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'isEmpty',
        value: '',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: undefined })).toBe(true)
      expect(evaluateCondition(rule, { field1: null })).toBe(true)
      expect(evaluateCondition(rule, { field1: '' })).toBe(true)
      expect(evaluateCondition(rule, { field1: [] })).toBe(true)
      expect(evaluateCondition(rule, { field1: 'value' })).toBe(false)
    })

    it('should evaluate isNotEmpty operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'isNotEmpty',
        value: '',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 'value' })).toBe(true)
      expect(evaluateCondition(rule, { field1: ['item'] })).toBe(true)
      expect(evaluateCondition(rule, { field1: '' })).toBe(false)
      expect(evaluateCondition(rule, { field1: null })).toBe(false)
    })

    it('should return true for unknown operator', () => {
      const rule: ConditionalRule = {
        sourceFieldId: 'field1',
        operator: 'unknown' as any,
        value: '',
        targetFieldId: 'field2',
        action: 'show',
      }

      expect(evaluateCondition(rule, { field1: 'value' })).toBe(true)
    })
  })

  describe('evaluateAllConditions', () => {
    const fields: FormField[] = [
      { id: 'field1', type: 'select', label: 'Type', required: false },
      { id: 'field2', type: 'text', label: 'Details', required: false },
      { id: 'field3', type: 'number', label: 'Amount', required: false },
    ]

    it('should initialize default field states', () => {
      const result = evaluateAllConditions([], {}, fields)

      expect(result.field1).toEqual({ hidden: false, disabled: false, required: false })
      expect(result.field2).toEqual({ hidden: false, disabled: false, required: false })
    })

    it('should show field when condition is met', () => {
      const rules: ConditionalRule[] = [
        {
          sourceFieldId: 'field1',
          operator: 'equals',
          value: 'other',
          targetFieldId: 'field2',
          action: 'show',
        },
      ]

      const result = evaluateAllConditions(rules, { field1: 'other' }, fields)
      expect(result.field2.hidden).toBe(false)
    })

    it('should hide field when show condition is not met', () => {
      const rules: ConditionalRule[] = [
        {
          sourceFieldId: 'field1',
          operator: 'equals',
          value: 'other',
          targetFieldId: 'field2',
          action: 'show',
        },
      ]

      const result = evaluateAllConditions(rules, { field1: 'something' }, fields)
      expect(result.field2.hidden).toBe(true)
    })

    it('should hide field when hide condition is met', () => {
      const rules: ConditionalRule[] = [
        {
          sourceFieldId: 'field1',
          operator: 'equals',
          value: 'hide-details',
          targetFieldId: 'field2',
          action: 'hide',
        },
      ]

      const result = evaluateAllConditions(rules, { field1: 'hide-details' }, fields)
      expect(result.field2.hidden).toBe(true)
    })

    it('should require field when require condition is met', () => {
      const rules: ConditionalRule[] = [
        {
          sourceFieldId: 'field1',
          operator: 'equals',
          value: 'needs-details',
          targetFieldId: 'field2',
          action: 'require',
        },
      ]

      const result = evaluateAllConditions(rules, { field1: 'needs-details' }, fields)
      expect(result.field2.required).toBe(true)
    })

    it('should disable field when disable condition is met', () => {
      const rules: ConditionalRule[] = [
        {
          sourceFieldId: 'field1',
          operator: 'equals',
          value: 'locked',
          targetFieldId: 'field2',
          action: 'disable',
        },
      ]

      const result = evaluateAllConditions(rules, { field1: 'locked' }, fields)
      expect(result.field2.disabled).toBe(true)
    })

    it('should handle multiple rules', () => {
      const rules: ConditionalRule[] = [
        {
          sourceFieldId: 'field1',
          operator: 'equals',
          value: 'special',
          targetFieldId: 'field2',
          action: 'require',
        },
        {
          sourceFieldId: 'field3',
          operator: 'greaterThan',
          value: 100,
          targetFieldId: 'field2',
          action: 'show',
        },
      ]

      const result = evaluateAllConditions(rules, { field1: 'special', field3: 50 }, fields)
      expect(result.field2.required).toBe(true)
      expect(result.field2.hidden).toBe(true) // Not > 100
    })
  })

  describe('evaluateFormula', () => {
    it('should evaluate simple addition', () => {
      const result = evaluateFormula('field1 + field2', { field1: 10, field2: 5 }, ['field1', 'field2'])
      expect(result).toBe(15)
    })

    it('should evaluate multiplication', () => {
      const result = evaluateFormula('field1 * field2', { field1: 4, field2: 3 }, ['field1', 'field2'])
      expect(result).toBe(12)
    })

    it('should evaluate complex expressions', () => {
      const result = evaluateFormula(
        '(field1 + field2) * field3',
        { field1: 10, field2: 5, field3: 2 },
        ['field1', 'field2', 'field3']
      )
      expect(result).toBe(30)
    })

    it('should handle sum function', () => {
      const result = evaluateFormula('sum(10, 20, 30)', {}, [])
      expect(result).toBe(60)
    })

    it('should handle average function', () => {
      const result = evaluateFormula('average(10, 20, 30)', {}, [])
      expect(result).toBe(20)
    })

    it('should handle min function', () => {
      const result = evaluateFormula('min(10, 5, 20)', {}, [])
      expect(result).toBe(5)
    })

    it('should handle max function', () => {
      const result = evaluateFormula('max(10, 5, 20)', {}, [])
      expect(result).toBe(20)
    })

    it('should handle missing fields as 0', () => {
      const result = evaluateFormula('field1 + field2', { field1: 10 }, ['field1', 'field2'])
      expect(result).toBe(10)
    })

    it('should return null for invalid expressions', () => {
      const result = evaluateFormula('invalid_expression()', {}, [])
      expect(result).toBe(null)
    })
  })

  describe('evaluateCalculatedFields', () => {
    it('should calculate single field', () => {
      const calculatedFields: CalculatedField[] = [
        {
          targetFieldId: 'total',
          formula: 'price * quantity',
          sourceFieldIds: ['price', 'quantity'],
        },
      ]

      const result = evaluateCalculatedFields(calculatedFields, { price: 25, quantity: 4 })
      expect(result.total).toBe(100)
    })

    it('should calculate multiple fields', () => {
      const calculatedFields: CalculatedField[] = [
        {
          targetFieldId: 'subtotal',
          formula: 'price * quantity',
          sourceFieldIds: ['price', 'quantity'],
        },
        {
          targetFieldId: 'tax',
          formula: 'subtotal * 0.1',
          sourceFieldIds: ['subtotal'],
        },
      ]

      const result = evaluateCalculatedFields(calculatedFields, { price: 100, quantity: 2, subtotal: 200 })
      expect(result.subtotal).toBe(200)
      expect(result.tax).toBe(20)
    })

    it('should preserve original form data', () => {
      const calculatedFields: CalculatedField[] = [
        {
          targetFieldId: 'total',
          formula: 'a + b',
          sourceFieldIds: ['a', 'b'],
        },
      ]

      const result = evaluateCalculatedFields(calculatedFields, { a: 5, b: 3, name: 'test' })
      expect(result.a).toBe(5)
      expect(result.b).toBe(3)
      expect(result.name).toBe('test')
      expect(result.total).toBe(8)
    })
  })

  describe('getOperatorsForFieldType', () => {
    it('should return number operators', () => {
      const operators = getOperatorsForFieldType('number')
      expect(operators).toContainEqual({ value: 'equals', label: 'Equals' })
      expect(operators).toContainEqual({ value: 'greaterThan', label: 'Greater than' })
      expect(operators).toContainEqual({ value: 'lessThan', label: 'Less than' })
    })

    it('should return text operators', () => {
      const operators = getOperatorsForFieldType('text')
      expect(operators).toContainEqual({ value: 'equals', label: 'Equals' })
      expect(operators).toContainEqual({ value: 'contains', label: 'Contains' })
    })

    it('should return select operators', () => {
      const operators = getOperatorsForFieldType('select')
      expect(operators).toContainEqual({ value: 'equals', label: 'Equals' })
      expect(operators).toContainEqual({ value: 'notEquals', label: 'Not equals' })
    })

    it('should return multiselect operators', () => {
      const operators = getOperatorsForFieldType('multiselect')
      expect(operators).toContainEqual({ value: 'contains', label: 'Contains' })
    })

    it('should return base operators for unknown type', () => {
      const operators = getOperatorsForFieldType('unknown')
      expect(operators).toEqual([
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
      ])
    })
  })
})
