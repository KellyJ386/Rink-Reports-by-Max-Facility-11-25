import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Max Facility Operations'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // SMS - Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Feature Flags
  ENABLE_SMS_NOTIFICATIONS: z.string().transform(v => v === 'true').default('false'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(v => v === 'true').default('true'),
  ENABLE_PUSH_NOTIFICATIONS: z.string().transform(v => v === 'true').default('false'),

  // Air Quality
  AIR_QUALITY_CO_WARNING: z.string().transform(Number).default('25'),
  AIR_QUALITY_CO_CRITICAL: z.string().transform(Number).default('35'),
  AIR_QUALITY_NO2_WARNING: z.string().transform(Number).default('0.5'),
  AIR_QUALITY_NO2_CRITICAL: z.string().transform(Number).default('1.0'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ')
      throw new Error(`Environment validation failed: ${missing}`)
    }
    throw error
  }
}

// Validate on import in production
let env: Env

if (process.env.NODE_ENV === 'production') {
  env = validateEnv()
} else {
  // In development, provide defaults for missing values
  env = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/mfo_dev',
    JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key-not-for-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Max Facility Operations',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    REDIS_URL: process.env.REDIS_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    LOG_LEVEL: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    ENABLE_SMS_NOTIFICATIONS: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
    AIR_QUALITY_CO_WARNING: Number(process.env.AIR_QUALITY_CO_WARNING) || 25,
    AIR_QUALITY_CO_CRITICAL: Number(process.env.AIR_QUALITY_CO_CRITICAL) || 35,
    AIR_QUALITY_NO2_WARNING: Number(process.env.AIR_QUALITY_NO2_WARNING) || 0.5,
    AIR_QUALITY_NO2_CRITICAL: Number(process.env.AIR_QUALITY_NO2_CRITICAL) || 1.0,
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  }
}

export { env }

// Helper to check if feature is enabled
export function isFeatureEnabled(feature: 'sms' | 'email' | 'push'): boolean {
  switch (feature) {
    case 'sms':
      return env.ENABLE_SMS_NOTIFICATIONS && Boolean(env.TWILIO_ACCOUNT_SID)
    case 'email':
      return env.ENABLE_EMAIL_NOTIFICATIONS && Boolean(env.SMTP_HOST || env.SMTP_FROM)
    case 'push':
      return env.ENABLE_PUSH_NOTIFICATIONS
    default:
      return false
  }
}

// Air quality thresholds
export const airQualityThresholds = {
  co: {
    warning: env.AIR_QUALITY_CO_WARNING,
    critical: env.AIR_QUALITY_CO_CRITICAL,
  },
  no2: {
    warning: env.AIR_QUALITY_NO2_WARNING,
    critical: env.AIR_QUALITY_NO2_CRITICAL,
  },
}
