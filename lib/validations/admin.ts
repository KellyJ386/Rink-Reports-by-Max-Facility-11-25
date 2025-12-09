import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  roleId: z.string().min(1, 'Role is required'),
  smsOptIn: z.boolean().optional().default(false),
  smsPreference: z.enum(['ALL', 'CRITICAL_ONLY', 'NONE']).optional().default('CRITICAL_ONLY'),
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  smsPreference: z.enum(['ALL', 'CRITICAL_ONLY', 'NONE']).optional(),
  permissionOverrides: z.record(z.any()).nullable().optional(),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
})

// Role validation schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  description: z.string().optional(),
  permissions: z.object({
    admin: z.object({
      access: z.boolean(),
      editUsers: z.boolean().optional(),
      editForms: z.boolean().optional(),
      editSettings: z.boolean().optional(),
    }),
    iceDepth: z.object({
      access: z.boolean(),
      submit: z.boolean().optional(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
    }),
    iceOperations: z.object({
      access: z.boolean(),
      submit: z.boolean().optional(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
    }),
    refrigeration: z.object({
      access: z.boolean(),
      submit: z.boolean().optional(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
    }),
    airQuality: z.object({
      access: z.boolean(),
      submit: z.boolean().optional(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
    }),
    incidents: z.object({
      access: z.boolean(),
      submit: z.boolean().optional(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
      approve: z.boolean().optional(),
    }),
    schedule: z.object({
      access: z.boolean(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      create: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      publish: z.boolean().optional(),
    }),
    dailyChecklist: z.object({
      access: z.boolean(),
      submit: z.boolean().optional(),
      viewOwn: z.boolean().optional(),
      viewAll: z.boolean().optional(),
      edit: z.boolean().optional(),
      delete: z.boolean().optional(),
      export: z.boolean().optional(),
      createTemplates: z.boolean().optional(),
    }),
  }),
})

export const updateRoleSchema = createRoleSchema.partial()

// Settings validation schemas
export const updateRetentionSettingsSchema = z.object({
  iceDepthRetention: z.number().min(0).max(3650).optional(),
  iceOpsRetention: z.number().min(0).max(3650).optional(),
  refrigerationRetention: z.number().min(0).max(3650).optional(),
  airQualityRetention: z.number().min(0).max(3650).optional(),
  incidentRetention: z.number().min(0).max(3650).optional(),
  scheduleRetention: z.number().min(0).max(3650).optional(),
  checklistRetention: z.number().min(0).max(3650).optional(),
})

export const updateAirQualitySettingsSchema = z.object({
  coWarningPpm: z.number().min(0).max(1000).optional(),
  coEvacuationPpm: z.number().min(0).max(1000).optional(),
  no2WarningPpm: z.number().min(0).max(100).optional(),
  no2EvacuationPpm: z.number().min(0).max(100).optional(),
  enableAirQualityAlerts: z.boolean().optional(),
})

export const updateSmsSettingsSchema = z.object({
  smsEnabled: z.boolean().optional(),
  smsProvider: z.enum(['twilio', 'messagebird', 'vonage']).nullable().optional(),
  smsAccountSid: z.string().nullable().optional(),
  smsAuthToken: z.string().nullable().optional(),
  smsFromNumber: z.string().nullable().optional(),
  smsQuietHoursStart: z.string().nullable().optional(),
  smsQuietHoursEnd: z.string().nullable().optional(),
  smsCriticalOverride: z.boolean().optional(),
})

// Form template validation schemas
export const createFormTemplateSchema = z.object({
  moduleType: z.enum([
    'ICE_DEPTH',
    'ICE_OPERATIONS',
    'REFRIGERATION',
    'AIR_QUALITY',
    'INCIDENT',
    'SCHEDULE',
    'DAILY_CHECKLIST',
  ]),
  name: z.string().min(1, 'Form name is required').max(200),
  description: z.string().optional(),
  schema: z.object({
    fields: z.array(
      z.object({
        id: z.string(),
        type: z.enum([
          'text',
          'number',
          'select',
          'checkbox',
          'textarea',
          'date',
          'time',
          'signature',
          'photo',
          'section',
        ]),
        label: z.string(),
        required: z.boolean().optional(),
        placeholder: z.string().optional(),
        helpText: z.string().optional(),
        options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        validation: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
          })
          .optional(),
        isLocked: z.boolean().optional(),
      })
    ),
  }),
})

export const updateFormTemplateSchema = createFormTemplateSchema.partial()

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateSchema>
