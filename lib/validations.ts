import { z } from 'zod'

// ==================== ENUMS ====================

export const ModuleTypeSchema = z.enum([
  'ICE_DEPTH',
  'ICE_OPERATIONS',
  'REFRIGERATION',
  'AIR_QUALITY',
  'INCIDENT',
  'SCHEDULE',
  'DAILY_CHECKLIST',
])

export const SubmissionStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
])

export const AttachmentTypeSchema = z.enum(['PHOTO', 'SIGNATURE', 'DOCUMENT'])

export const ScheduleStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'FILLED', 'CANCELLED'])

export const AuditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'ARCHIVE',
  'APPROVE',
  'REJECT',
  'LOGIN',
  'LOGOUT',
])

export const NotificationTypeSchema = z.enum([
  'INCIDENT_SUBMITTED',
  'INCIDENT_AMBULANCE',
  'AIR_QUALITY_WARNING',
  'AIR_QUALITY_EVACUATION',
  'SCHEDULE_PUBLISHED',
  'SHIFT_OPEN',
  'SHIFT_EMERGENCY',
  'REPORT_REMINDER',
  'SYSTEM',
])

export const SMSStatusSchema = z.enum(['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED'])

export const SMSPreferenceSchema = z.enum(['ALL', 'CRITICAL_ONLY', 'NONE'])

export const IceDepthPresetSchema = z.enum(['RINK_25', 'RINK_35', 'RINK_47', 'CUSTOM'])

// ==================== AUTH ====================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  facilityId: z.string().cuid(),
  roleId: z.string().cuid(),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// ==================== FACILITY ====================

export const CreateFacilitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(50),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  country: z.string().max(50).default('US'),
  timezone: z.string().default('America/New_York'),
})

export const UpdateFacilitySchema = CreateFacilitySchema.partial()

export const FacilitySettingsSchema = z.object({
  // Retention settings (days)
  iceDepthRetention: z.number().int().min(0).default(1095),
  iceOpsRetention: z.number().int().min(0).default(1095),
  refrigerationRetention: z.number().int().min(0).default(1095),
  airQualityRetention: z.number().int().min(0).default(1095),
  incidentRetention: z.number().int().min(0).default(2555),
  scheduleRetention: z.number().int().min(0).default(1095),
  checklistRetention: z.number().int().min(0).default(1095),

  // Air quality thresholds
  coWarningPpm: z.number().min(0).default(20),
  coEvacuationPpm: z.number().min(0).default(83),
  no2WarningPpm: z.number().min(0).default(0.3),
  no2EvacuationPpm: z.number().min(0).default(2.0),
  enableAirQualityAlerts: z.boolean().default(true),

  // SMS Settings
  smsEnabled: z.boolean().default(false),
  smsProvider: z.enum(['twilio', 'messagebird', 'vonage']).optional(),
  smsAccountSid: z.string().optional(),
  smsAuthToken: z.string().optional(),
  smsFromNumber: z.string().optional(),
  smsQuietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)')
    .optional(),
  smsQuietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)')
    .optional(),
  smsCriticalOverride: z.boolean().default(true),
})

// ==================== RINK ====================

export const CreateRinkSchema = z.object({
  facilityId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(100),
  dimensions: z.string().max(50).optional(),
  surfaceType: z.string().default('ice'),
  isActive: z.boolean().default(true),
})

export const UpdateRinkSchema = CreateRinkSchema.omit({ facilityId: true }).partial()

// ==================== USER ====================

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().max(20).optional(),
  facilityId: z.string().cuid(),
  roleId: z.string().cuid(),
  smsPreference: SMSPreferenceSchema.default('CRITICAL_ONLY'),
  permissionOverrides: z.record(z.any()).optional(),
})

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional().nullable(),
  roleId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
  smsPreference: SMSPreferenceSchema.optional(),
  smsOptIn: z.boolean().optional(),
  permissionOverrides: z.record(z.any()).optional().nullable(),
})

// ==================== ROLE ====================

export const ModulePermissionsSchema = z.object({
  access: z.boolean(),
  submit: z.boolean().optional(),
  viewOwn: z.boolean().optional(),
  viewAll: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
  export: z.boolean().optional(),
  approve: z.boolean().optional(),
  createTemplates: z.boolean().optional(),
  create: z.boolean().optional(),
  publish: z.boolean().optional(),
})

export const PermissionSetSchema = z.object({
  admin: ModulePermissionsSchema,
  iceDepth: ModulePermissionsSchema,
  iceOperations: ModulePermissionsSchema,
  refrigeration: ModulePermissionsSchema,
  airQuality: ModulePermissionsSchema,
  incidents: ModulePermissionsSchema,
  schedule: ModulePermissionsSchema,
  dailyChecklist: ModulePermissionsSchema,
})

export const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  facilityId: z.string().cuid().optional(),
  permissions: PermissionSetSchema,
})

export const UpdateRoleSchema = CreateRoleSchema.partial()

// ==================== FORM TEMPLATE ====================

export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'number',
    'email',
    'phone',
    'select',
    'checkbox',
    'checkboxGroup',
    'radioGroup',
    'date',
    'time',
    'datetime',
    'signature',
    'photo',
    'iceDepthGrid',
    'bodyDiagram',
    'section',
    'weather',
  ]),
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  hidden: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      patternMessage: z.string().optional(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  conditionalRules: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty']),
        value: z.any(),
        action: z.enum(['show', 'hide', 'require', 'disable']),
      })
    )
    .optional(),
})

export const FormSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
})

export const FormSchemaSchema = z.object({
  sections: z.array(FormSectionSchema),
})

export const CreateFormTemplateSchema = z.object({
  facilityId: z.string().cuid(),
  moduleType: ModuleTypeSchema,
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  schema: FormSchemaSchema,
  conditionalRules: z.array(z.any()).optional(),
  calculatedFields: z.array(z.any()).optional(),
})

export const UpdateFormTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  schema: FormSchemaSchema.optional(),
  conditionalRules: z.array(z.any()).optional().nullable(),
  calculatedFields: z.array(z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
})

// ==================== SUBMISSION ====================

export const CreateSubmissionSchema = z.object({
  formTemplateId: z.string().cuid(),
  rinkId: z.string().cuid(),
  outsideTemp: z.number().optional(),
  outsideTempUnit: z.enum(['F', 'C']).default('F'),
  data: z.record(z.any()),
  status: SubmissionStatusSchema.default('SUBMITTED'),
  clientId: z.string().uuid().optional(), // For offline sync deduplication
})

export const UpdateSubmissionSchema = z.object({
  data: z.record(z.any()).optional(),
  status: SubmissionStatusSchema.optional(),
  outsideTemp: z.number().optional().nullable(),
  outsideTempUnit: z.enum(['F', 'C']).optional(),
})

export const ReviewSubmissionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().max(1000).optional(),
})

// ==================== ATTACHMENT ====================

export const CreateAttachmentSchema = z.object({
  submissionId: z.string().cuid(),
  fieldId: z.string(),
  type: AttachmentTypeSchema,
  fileName: z.string().max(255),
  fileSize: z.number().int().min(1).max(50 * 1024 * 1024), // Max 50MB
  mimeType: z.string().max(100),
  storageKey: z.string(),
})

// ==================== SCHEDULE ====================

export const CreateShiftDefinitionSchema = z.object({
  facilityId: z.string().cuid(),
  rinkId: z.string().cuid().optional(),
  name: z.string().min(1, 'Name is required').max(50),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  isActive: z.boolean().default(true),
})

export const UpdateShiftDefinitionSchema = CreateShiftDefinitionSchema.omit({
  facilityId: true,
}).partial()

export const CreateScheduleEntrySchema = z.object({
  userId: z.string().cuid(),
  shiftId: z.string().cuid().optional(),
  rinkId: z.string().cuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)'),
  isOpenShift: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  status: ScheduleStatusSchema.default('DRAFT'),
})

export const UpdateScheduleEntrySchema = CreateScheduleEntrySchema.omit({ userId: true }).partial()

export const PublishScheduleSchema = z.object({
  entryIds: z.array(z.string().cuid()).min(1, 'At least one entry is required'),
})

// ==================== NOTIFICATIONS ====================

export const CreateNotificationSchema = z.object({
  facilityId: z.string().cuid(),
  recipientUserId: z.string().cuid().optional(),
  recipientRoleId: z.string().cuid().optional(),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().cuid().optional(),
})

// ==================== ICE DEPTH CONFIGURATION ====================

export const MeasurementPointSchema = z.object({
  id: z.string(),
  x: z.number().min(0).max(100), // Percentage position
  y: z.number().min(0).max(100),
  label: z.string().max(20),
})

export const CreateIceDepthConfigSchema = z.object({
  rinkId: z.string().cuid(),
  presetType: IceDepthPresetSchema.optional(),
  measurementPoints: z.array(MeasurementPointSchema).min(1).max(52), // Max 47 + 5 custom
  backgroundImage: z.string().url().optional(),
})

export const UpdateIceDepthConfigSchema = CreateIceDepthConfigSchema.omit({ rinkId: true }).partial()

// ==================== QUERY PARAMS ====================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const SubmissionQuerySchema = PaginationQuerySchema.extend({
  moduleType: ModuleTypeSchema.optional(),
  rinkId: z.string().cuid().optional(),
  status: SubmissionStatusSchema.optional(),
  submittedById: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(['submittedAt', 'updatedAt', 'status']).default('submittedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})

export const ScheduleQuerySchema = PaginationQuerySchema.extend({
  rinkId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  status: ScheduleStatusSchema.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isOpenShift: z.coerce.boolean().optional(),
})

export const AuditLogQuerySchema = PaginationQuerySchema.extend({
  userId: z.string().cuid().optional(),
  action: AuditActionSchema.optional(),
  entityType: z.string().optional(),
  entityId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

// ==================== TYPE EXPORTS ====================

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
export type CreateFacilityInput = z.infer<typeof CreateFacilitySchema>
export type UpdateFacilityInput = z.infer<typeof UpdateFacilitySchema>
export type FacilitySettingsInput = z.infer<typeof FacilitySettingsSchema>
export type CreateRinkInput = z.infer<typeof CreateRinkSchema>
export type UpdateRinkInput = z.infer<typeof UpdateRinkSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>
export type CreateFormTemplateInput = z.infer<typeof CreateFormTemplateSchema>
export type UpdateFormTemplateInput = z.infer<typeof UpdateFormTemplateSchema>
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>
export type UpdateSubmissionInput = z.infer<typeof UpdateSubmissionSchema>
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionSchema>
export type CreateAttachmentInput = z.infer<typeof CreateAttachmentSchema>
export type CreateShiftDefinitionInput = z.infer<typeof CreateShiftDefinitionSchema>
export type UpdateShiftDefinitionInput = z.infer<typeof UpdateShiftDefinitionSchema>
export type CreateScheduleEntryInput = z.infer<typeof CreateScheduleEntrySchema>
export type UpdateScheduleEntryInput = z.infer<typeof UpdateScheduleEntrySchema>
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>
export type CreateIceDepthConfigInput = z.infer<typeof CreateIceDepthConfigSchema>
export type UpdateIceDepthConfigInput = z.infer<typeof UpdateIceDepthConfigSchema>
export type FormField = z.infer<typeof FormFieldSchema>
export type FormSection = z.infer<typeof FormSectionSchema>
export type FormSchema = z.infer<typeof FormSchemaSchema>
export type MeasurementPoint = z.infer<typeof MeasurementPointSchema>
export type SubmissionQuery = z.infer<typeof SubmissionQuerySchema>
export type ScheduleQuery = z.infer<typeof ScheduleQuerySchema>
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>
