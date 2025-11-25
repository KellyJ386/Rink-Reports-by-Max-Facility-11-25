import type { FormSchema } from '@/types/forms'

/**
 * Sample form schema for Ice Make
 * In production, this would be loaded from the database
 */
export const iceMakeFormSchema: FormSchema = {
  id: 'ice-make-v1',
  name: 'Ice Make Report',
  description: 'Track water usage, temperature, and ice quality during ice making',
  moduleType: 'iceOperations',
  version: 1,
  header: {
    includeUser: true,
    includeFacility: true,
    includeRink: true,
    includeDateTime: true,
    includeOutsideTemp: true,
  },
  sections: [
    {
      id: 'water-section',
      title: 'Water & Temperature',
      description: 'Record water usage and temperature measurements',
      order: 1,
      fields: [
        {
          id: 'water-used',
          type: 'number',
          label: 'Water Used',
          required: true,
          min: 0,
          max: 500,
          decimalPlaces: 0,
          placeholder: 'Enter gallons',
          helpText: 'Total gallons of water used for this ice make',
          order: 1,
        },
        {
          id: 'water-type',
          type: 'dropdown',
          label: 'Water Type',
          required: true,
          options: ['Hot Water', 'Cold Water', 'Mixed'],
          placeholder: 'Select water type',
          order: 2,
        },
        {
          id: 'ice-temp-before',
          type: 'temperature',
          label: 'Ice Temperature (Before)',
          required: true,
          min: -20,
          max: 40,
          unit: 'F',
          placeholder: 'Enter temperature',
          order: 3,
        },
        {
          id: 'ice-temp-after',
          type: 'temperature',
          label: 'Ice Temperature (After)',
          required: false,
          min: -20,
          max: 40,
          unit: 'F',
          placeholder: 'Enter temperature',
          order: 4,
        },
      ],
    },
    {
      id: 'surface-section',
      title: 'Surface Condition',
      description: 'Assess ice surface quality and any issues',
      order: 2,
      fields: [
        {
          id: 'snow-removed',
          type: 'number',
          label: 'Snow Removed',
          required: false,
          min: 0,
          max: 50,
          decimalPlaces: 0,
          placeholder: 'Enter buckets/loads',
          helpText: 'Number of buckets or loads of snow removed',
          order: 1,
        },
        {
          id: 'surface-quality',
          type: 'dropdown',
          label: 'Surface Quality',
          required: true,
          options: ['Excellent', 'Good', 'Fair', 'Poor'],
          placeholder: 'Select quality rating',
          order: 2,
        },
        {
          id: 'has-issues',
          type: 'toggle',
          label: 'Surface Issues Present',
          required: false,
          defaultValue: false,
          order: 3,
        },
        {
          id: 'notes',
          type: 'textarea',
          label: 'Notes',
          required: false,
          rows: 4,
          maxLength: 500,
          placeholder: 'Enter any additional notes or observations...',
          helpText: 'Any issues, observations, or special conditions',
          order: 4,
        },
      ],
    },
  ],
  conditionalRules: [
    {
      id: 'rule-show-issue-notes',
      conditions: [
        {
          fieldId: 'has-issues',
          operator: 'equals',
          value: true,
        },
      ],
      conditionLogic: 'AND',
      actions: [
        {
          type: 'require',
          targetFieldId: 'notes',
        },
      ],
    },
  ],
}

/**
 * Sample form schemas for other Ice Operations tabs
 * These are placeholders for now
 */
export const circleCheckFormSchema: FormSchema = {
  id: 'circle-check-v1',
  name: 'Circle Check',
  description: 'Pre-shift inspection checklist',
  moduleType: 'iceOperations',
  version: 1,
  header: {
    includeUser: true,
    includeFacility: true,
    includeRink: true,
    includeDateTime: true,
    includeOutsideTemp: false,
  },
  sections: [
    {
      id: 'placeholder',
      title: 'Coming Soon',
      order: 1,
      fields: [
        {
          id: 'placeholder-text',
          type: 'text',
          label: 'Placeholder',
          required: false,
          order: 1,
        },
      ],
    },
  ],
}

export const edgingFormSchema: FormSchema = {
  id: 'edging-v1',
  name: 'Edging Report',
  description: 'Track edging activities',
  moduleType: 'iceOperations',
  version: 1,
  header: {
    includeUser: true,
    includeFacility: true,
    includeRink: true,
    includeDateTime: true,
    includeOutsideTemp: false,
  },
  sections: [
    {
      id: 'placeholder',
      title: 'Coming Soon',
      order: 1,
      fields: [
        {
          id: 'placeholder-text',
          type: 'text',
          label: 'Placeholder',
          required: false,
          order: 1,
        },
      ],
    },
  ],
}

export const bladeChangeFormSchema: FormSchema = {
  id: 'blade-change-v1',
  name: 'Blade Change Log',
  description: 'Track blade changes and maintenance',
  moduleType: 'iceOperations',
  version: 1,
  header: {
    includeUser: true,
    includeFacility: true,
    includeRink: true,
    includeDateTime: true,
    includeOutsideTemp: false,
  },
  sections: [
    {
      id: 'placeholder',
      title: 'Coming Soon',
      order: 1,
      fields: [
        {
          id: 'placeholder-text',
          type: 'text',
          label: 'Placeholder',
          required: false,
          order: 1,
        },
      ],
    },
  ],
}
