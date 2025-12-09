import { describe, it, expect } from 'vitest'
import {
  LoginSchema,
  RegisterSchema,
  CreateFacilitySchema,
  CreateUserSchema,
  CreateSubmissionSchema,
  CreateFormTemplateSchema,
  CreateScheduleEntrySchema,
  FacilitySettingsSchema,
  FormFieldSchema,
  MeasurementPointSchema,
  PaginationQuerySchema,
} from '@/lib/validations'

describe('Auth Validation Schemas', () => {
  describe('LoginSchema', () => {
    it('should accept valid login credentials', () => {
      const result = LoginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = LoginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = LoginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('RegisterSchema', () => {
    const validData = {
      email: 'newuser@example.com',
      password: 'SecurePass1',
      firstName: 'John',
      lastName: 'Doe',
      facilityId: 'clxxxxxxxxxxxxxxxxxx001',
      roleId: 'clxxxxxxxxxxxxxxxxxx002',
    }

    it('should accept valid registration data', () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject password without uppercase', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'securepass1',
      })
      expect(result.success).toBe(false)
    })

    it('should reject password without lowercase', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'SECUREPASS1',
      })
      expect(result.success).toBe(false)
    })

    it('should reject password without number', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'SecurePassword',
      })
      expect(result.success).toBe(false)
    })

    it('should reject password under 8 characters', () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: 'Pass1',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Facility Validation Schemas', () => {
  describe('CreateFacilitySchema', () => {
    it('should accept valid facility data', () => {
      const result = CreateFacilitySchema.safeParse({
        name: 'Test Ice Arena',
        address: '123 Main St',
        city: 'Minneapolis',
        state: 'MN',
        zipCode: '55401',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.country).toBe('US')
        expect(result.data.timezone).toBe('America/New_York')
      }
    })

    it('should reject missing required fields', () => {
      const result = CreateFacilitySchema.safeParse({
        name: 'Test Arena',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('FacilitySettingsSchema', () => {
    it('should accept valid settings', () => {
      const result = FacilitySettingsSchema.safeParse({
        coWarningPpm: 25,
        coEvacuationPpm: 100,
        smsEnabled: true,
        smsProvider: 'twilio',
      })
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const result = FacilitySettingsSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.iceDepthRetention).toBe(1095)
        expect(result.data.incidentRetention).toBe(2555)
        expect(result.data.coWarningPpm).toBe(20)
      }
    })

    it('should validate time format for quiet hours', () => {
      const result = FacilitySettingsSchema.safeParse({
        smsQuietHoursStart: '22:00',
        smsQuietHoursEnd: '07:00',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid time format', () => {
      const result = FacilitySettingsSchema.safeParse({
        smsQuietHoursStart: '10:00 PM',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('User Validation Schemas', () => {
  describe('CreateUserSchema', () => {
    const validUser = {
      email: 'operator@example.com',
      password: 'SecurePass1',
      firstName: 'Jane',
      lastName: 'Smith',
      facilityId: 'clxxxxxxxxxxxxxxxxxx001',
      roleId: 'clxxxxxxxxxxxxxxxxxx002',
    }

    it('should accept valid user data', () => {
      const result = CreateUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should apply default SMS preference', () => {
      const result = CreateUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.smsPreference).toBe('CRITICAL_ONLY')
      }
    })

    it('should accept optional phone', () => {
      const result = CreateUserSchema.safeParse({
        ...validUser,
        phone: '+1-555-123-4567',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Submission Validation Schemas', () => {
  describe('CreateSubmissionSchema', () => {
    const validSubmission = {
      formTemplateId: 'clxxxxxxxxxxxxxxxxxx001',
      rinkId: 'clxxxxxxxxxxxxxxxxxx002',
      data: { field1: 'value1', field2: 42 },
    }

    it('should accept valid submission', () => {
      const result = CreateSubmissionSchema.safeParse(validSubmission)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const result = CreateSubmissionSchema.safeParse(validSubmission)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('SUBMITTED')
        expect(result.data.outsideTempUnit).toBe('F')
      }
    })

    it('should accept optional outside temperature', () => {
      const result = CreateSubmissionSchema.safeParse({
        ...validSubmission,
        outsideTemp: 32.5,
        outsideTempUnit: 'F',
      })
      expect(result.success).toBe(true)
    })

    it('should accept client ID for offline sync', () => {
      const result = CreateSubmissionSchema.safeParse({
        ...validSubmission,
        clientId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Form Template Validation Schemas', () => {
  describe('FormFieldSchema', () => {
    it('should accept valid text field', () => {
      const result = FormFieldSchema.safeParse({
        id: 'field-1',
        type: 'text',
        label: 'Enter your name',
        required: true,
      })
      expect(result.success).toBe(true)
    })

    it('should accept field with options', () => {
      const result = FormFieldSchema.safeParse({
        id: 'field-2',
        type: 'select',
        label: 'Choose option',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should accept field with validation rules', () => {
      const result = FormFieldSchema.safeParse({
        id: 'field-3',
        type: 'number',
        label: 'Enter value',
        validation: {
          min: 0,
          max: 100,
        },
      })
      expect(result.success).toBe(true)
    })

    it('should accept ice depth grid field', () => {
      const result = FormFieldSchema.safeParse({
        id: 'ice-depth',
        type: 'iceDepthGrid',
        label: 'Ice Depth Measurements',
      })
      expect(result.success).toBe(true)
    })

    it('should accept body diagram field', () => {
      const result = FormFieldSchema.safeParse({
        id: 'injury-location',
        type: 'bodyDiagram',
        label: 'Mark injury location',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('CreateFormTemplateSchema', () => {
    const validTemplate = {
      facilityId: 'clxxxxxxxxxxxxxxxxxx001',
      moduleType: 'ICE_DEPTH',
      name: 'Ice Depth Report',
      schema: {
        sections: [
          {
            id: 'section-1',
            title: 'Measurements',
            fields: [
              { id: 'field-1', type: 'number', label: 'Depth' },
            ],
          },
        ],
      },
    }

    it('should accept valid form template', () => {
      const result = CreateFormTemplateSchema.safeParse(validTemplate)
      expect(result.success).toBe(true)
    })

    it('should validate module type enum', () => {
      const result = CreateFormTemplateSchema.safeParse({
        ...validTemplate,
        moduleType: 'INVALID_TYPE',
      })
      expect(result.success).toBe(false)
    })

    it('should accept all valid module types', () => {
      const moduleTypes = [
        'ICE_DEPTH',
        'ICE_OPERATIONS',
        'REFRIGERATION',
        'AIR_QUALITY',
        'INCIDENT',
        'SCHEDULE',
        'DAILY_CHECKLIST',
      ]

      moduleTypes.forEach((moduleType) => {
        const result = CreateFormTemplateSchema.safeParse({
          ...validTemplate,
          moduleType,
        })
        expect(result.success).toBe(true)
      })
    })
  })
})

describe('Schedule Validation Schemas', () => {
  describe('CreateScheduleEntrySchema', () => {
    const validEntry = {
      userId: 'clxxxxxxxxxxxxxxxxxx001',
      date: '2024-01-15',
      startTime: '06:00',
      endTime: '14:00',
    }

    it('should accept valid schedule entry', () => {
      const result = CreateScheduleEntrySchema.safeParse(validEntry)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = CreateScheduleEntrySchema.safeParse({
        ...validEntry,
        date: '01/15/2024',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid time format', () => {
      const result = CreateScheduleEntrySchema.safeParse({
        ...validEntry,
        startTime: '6:00 AM',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional shift and rink IDs', () => {
      const result = CreateScheduleEntrySchema.safeParse({
        ...validEntry,
        shiftId: 'clxxxxxxxxxxxxxxxxxx002',
        rinkId: 'clxxxxxxxxxxxxxxxxxx003',
      })
      expect(result.success).toBe(true)
    })

    it('should apply default status', () => {
      const result = CreateScheduleEntrySchema.safeParse(validEntry)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('DRAFT')
      }
    })
  })
})

describe('Ice Depth Configuration Schemas', () => {
  describe('MeasurementPointSchema', () => {
    it('should accept valid measurement point', () => {
      const result = MeasurementPointSchema.safeParse({
        id: 'point-1',
        x: 25.5,
        y: 50.0,
        label: 'Center',
      })
      expect(result.success).toBe(true)
    })

    it('should reject x outside 0-100 range', () => {
      const result = MeasurementPointSchema.safeParse({
        id: 'point-1',
        x: 150,
        y: 50,
        label: 'Invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject label over 20 characters', () => {
      const result = MeasurementPointSchema.safeParse({
        id: 'point-1',
        x: 50,
        y: 50,
        label: 'This label is way too long to be valid',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Query Parameter Schemas', () => {
  describe('PaginationQuerySchema', () => {
    it('should parse valid pagination params', () => {
      const result = PaginationQuerySchema.safeParse({
        page: '2',
        limit: '50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should apply default values', () => {
      const result = PaginationQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should cap limit at 100', () => {
      const result = PaginationQuerySchema.safeParse({
        limit: '500',
      })
      expect(result.success).toBe(false)
    })

    it('should reject page less than 1', () => {
      const result = PaginationQuerySchema.safeParse({
        page: '0',
      })
      expect(result.success).toBe(false)
    })
  })
})
