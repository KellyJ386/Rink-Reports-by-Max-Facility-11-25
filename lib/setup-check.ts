/**
 * Setup Validation Utility
 *
 * This module provides comprehensive checks to validate that the application
 * is properly configured and all required components are in place.
 */

import { existsSync } from 'fs'
import { join } from 'path'

export interface SetupCheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  details?: string
}

export interface SetupStatus {
  ready: boolean
  checks: SetupCheckResult[]
  summary: {
    total: number
    passed: number
    warnings: number
    errors: number
  }
}

/**
 * Required environment variables for the application to function
 */
const REQUIRED_ENV_VARS = [
  { name: 'DATABASE_URL', critical: true, description: 'PostgreSQL connection string' },
  { name: 'JWT_SECRET', critical: true, description: 'Secret key for JWT signing' },
] as const

/**
 * Optional environment variables that enable additional features
 */
const OPTIONAL_ENV_VARS = [
  { name: 'JWT_EXPIRES_IN', default: '7d', description: 'Token expiration time' },
  { name: 'OPENWEATHER_API_KEY', description: 'Weather API integration' },
  { name: 'RESEND_API_KEY', description: 'Email service' },
  { name: 'TWILIO_ACCOUNT_SID', description: 'SMS notifications' },
  { name: 'NEXT_PUBLIC_APP_URL', default: 'http://localhost:3000', description: 'Application URL' },
] as const

/**
 * Expected dashboard routes that should exist
 */
export const EXPECTED_ROUTES = [
  { path: 'ice-depth', label: 'Ice Depth', module: 'iceDepth' },
  { path: 'ice-operations', label: 'Ice Operations', module: 'iceOperations' },
  { path: 'refrigeration', label: 'Refrigeration', module: 'refrigeration' },
  { path: 'air-quality', label: 'Air Quality', module: 'airQuality' },
  { path: 'incidents', label: 'Incidents', module: 'incidents' },
  { path: 'schedule', label: 'Schedule', module: 'schedule' },
  { path: 'checklists', label: 'Daily Checklists', module: 'dailyChecklist' },
  { path: 'admin', label: 'Admin', module: 'admin' },
] as const

/**
 * Check if required environment variables are set
 */
export function checkEnvironmentVariables(): SetupCheckResult[] {
  const results: SetupCheckResult[] = []

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name]
    if (!value) {
      results.push({
        name: `ENV: ${envVar.name}`,
        status: 'error',
        message: `Missing required environment variable`,
        details: envVar.description,
      })
    } else if (value.includes('your-') || value.includes('change-in-production')) {
      results.push({
        name: `ENV: ${envVar.name}`,
        status: 'warning',
        message: `Using placeholder value - update for production`,
        details: envVar.description,
      })
    } else {
      results.push({
        name: `ENV: ${envVar.name}`,
        status: 'ok',
        message: `Configured`,
        details: envVar.description,
      })
    }
  }

  // Check optional variables
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name]
    if (!value && !envVar.default) {
      results.push({
        name: `ENV: ${envVar.name}`,
        status: 'warning',
        message: `Not configured (optional)`,
        details: envVar.description,
      })
    } else {
      results.push({
        name: `ENV: ${envVar.name}`,
        status: 'ok',
        message: value ? 'Configured' : `Using default: ${envVar.default}`,
        details: envVar.description,
      })
    }
  }

  return results
}

/**
 * Check if dashboard routes exist in the filesystem
 */
export function checkDashboardRoutes(basePath: string = process.cwd()): SetupCheckResult[] {
  const results: SetupCheckResult[] = []
  const dashboardPath = join(basePath, 'app', 'dashboard')

  for (const route of EXPECTED_ROUTES) {
    const routePath = join(dashboardPath, route.path)
    const pageExists = existsSync(join(routePath, 'page.tsx')) || existsSync(join(routePath, 'page.ts'))

    if (pageExists) {
      results.push({
        name: `Route: /dashboard/${route.path}`,
        status: 'ok',
        message: `Page exists`,
        details: route.label,
      })
    } else {
      results.push({
        name: `Route: /dashboard/${route.path}`,
        status: 'warning',
        message: `Page not implemented`,
        details: `${route.label} module - navigation will show "Coming Soon"`,
      })
    }
  }

  return results
}

/**
 * Check database connectivity
 */
export async function checkDatabaseConnection(): Promise<SetupCheckResult> {
  try {
    // Dynamic import to avoid issues when prisma client isn't generated
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return {
      name: 'Database Connection',
      status: 'ok',
      message: 'Connected successfully',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('ECONNREFUSED')) {
      return {
        name: 'Database Connection',
        status: 'error',
        message: 'Cannot connect to database server',
        details: 'Ensure PostgreSQL is running and DATABASE_URL is correct',
      }
    }

    if (errorMessage.includes('does not exist')) {
      return {
        name: 'Database Connection',
        status: 'error',
        message: 'Database does not exist',
        details: 'Run: npm run prisma:migrate to create the database',
      }
    }

    if (errorMessage.includes('prisma generate')) {
      return {
        name: 'Database Connection',
        status: 'error',
        message: 'Prisma client not generated',
        details: 'Run: npm run prisma:generate',
      }
    }

    return {
      name: 'Database Connection',
      status: 'error',
      message: 'Database connection failed',
      details: errorMessage,
    }
  }
}

/**
 * Check if database has been seeded with initial data
 */
export async function checkDatabaseSeeded(): Promise<SetupCheckResult> {
  try {
    const { prisma } = await import('@/lib/prisma')

    const [facilityCount, userCount, roleCount] = await Promise.all([
      prisma.facility.count(),
      prisma.user.count(),
      prisma.role.count(),
    ])

    if (facilityCount === 0 || userCount === 0 || roleCount === 0) {
      return {
        name: 'Database Seed Data',
        status: 'warning',
        message: 'Database is empty',
        details: 'Run: npm run prisma:seed to add demo data',
      }
    }

    return {
      name: 'Database Seed Data',
      status: 'ok',
      message: `Found ${facilityCount} facility, ${userCount} users, ${roleCount} roles`,
    }
  } catch (error) {
    return {
      name: 'Database Seed Data',
      status: 'error',
      message: 'Could not check seed data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if required files exist
 */
export function checkRequiredFiles(basePath: string = process.cwd()): SetupCheckResult[] {
  const results: SetupCheckResult[] = []

  const requiredFiles = [
    { path: '.env', description: 'Environment configuration', critical: true },
    { path: 'prisma/schema.prisma', description: 'Database schema', critical: true },
    { path: 'public/manifest.json', description: 'PWA manifest', critical: false },
  ]

  for (const file of requiredFiles) {
    const filePath = join(basePath, file.path)
    const exists = existsSync(filePath)

    if (exists) {
      results.push({
        name: `File: ${file.path}`,
        status: 'ok',
        message: 'Exists',
        details: file.description,
      })
    } else {
      results.push({
        name: `File: ${file.path}`,
        status: file.critical ? 'error' : 'warning',
        message: 'Missing',
        details: file.critical
          ? `Required: ${file.description}`
          : `Optional: ${file.description}`,
      })
    }
  }

  // Check for PWA icons if manifest exists
  const manifestPath = join(basePath, 'public/manifest.json')
  if (existsSync(manifestPath)) {
    const icon192 = existsSync(join(basePath, 'public/icon-192.png'))
    const icon512 = existsSync(join(basePath, 'public/icon-512.png'))

    if (!icon192 || !icon512) {
      results.push({
        name: 'PWA Icons',
        status: 'warning',
        message: 'Missing icon files referenced in manifest.json',
        details: 'Add icon-192.png and icon-512.png to /public/',
      })
    } else {
      results.push({
        name: 'PWA Icons',
        status: 'ok',
        message: 'All icons present',
      })
    }
  }

  return results
}

/**
 * Run all setup checks and return comprehensive status
 */
export async function runAllChecks(basePath?: string): Promise<SetupStatus> {
  const checks: SetupCheckResult[] = []

  // Environment checks
  checks.push(...checkEnvironmentVariables())

  // File checks
  checks.push(...checkRequiredFiles(basePath))

  // Route checks
  checks.push(...checkDashboardRoutes(basePath))

  // Database checks (only if DATABASE_URL is set)
  if (process.env.DATABASE_URL) {
    checks.push(await checkDatabaseConnection())

    // Only check seeding if connection succeeded
    const dbCheck = checks.find(c => c.name === 'Database Connection')
    if (dbCheck?.status === 'ok') {
      checks.push(await checkDatabaseSeeded())
    }
  }

  // Calculate summary
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'ok').length,
    warnings: checks.filter(c => c.status === 'warning').length,
    errors: checks.filter(c => c.status === 'error').length,
  }

  return {
    ready: summary.errors === 0,
    checks,
    summary,
  }
}

/**
 * Get a simple status for display in the UI
 */
export function getStatusEmoji(status: 'ok' | 'warning' | 'error'): string {
  switch (status) {
    case 'ok': return '✓'
    case 'warning': return '!'
    case 'error': return '✗'
  }
}

/**
 * Format check results for console output
 */
export function formatCheckResults(status: SetupStatus): string {
  const lines: string[] = [
    '',
    '═══════════════════════════════════════════════════════════',
    '  MFO Ice Rink SaaS - Setup Status',
    '═══════════════════════════════════════════════════════════',
    '',
  ]

  // Group checks by category
  const envChecks = status.checks.filter(c => c.name.startsWith('ENV:'))
  const fileChecks = status.checks.filter(c => c.name.startsWith('File:') || c.name === 'PWA Icons')
  const routeChecks = status.checks.filter(c => c.name.startsWith('Route:'))
  const dbChecks = status.checks.filter(c => c.name.startsWith('Database'))

  const addSection = (title: string, checks: SetupCheckResult[]) => {
    if (checks.length === 0) return
    lines.push(`  ${title}`)
    lines.push('  ' + '─'.repeat(55))
    for (const check of checks) {
      const emoji = getStatusEmoji(check.status)
      const name = check.name.replace(/^(ENV|File|Route): /, '')
      lines.push(`    ${emoji} ${name}: ${check.message}`)
      if (check.details && check.status !== 'ok') {
        lines.push(`      → ${check.details}`)
      }
    }
    lines.push('')
  }

  addSection('Environment Variables', envChecks)
  addSection('Required Files', fileChecks)
  addSection('Dashboard Routes', routeChecks)
  addSection('Database', dbChecks)

  // Summary
  lines.push('  Summary')
  lines.push('  ' + '─'.repeat(55))
  lines.push(`    Total Checks: ${status.summary.total}`)
  lines.push(`    Passed: ${status.summary.passed}`)
  lines.push(`    Warnings: ${status.summary.warnings}`)
  lines.push(`    Errors: ${status.summary.errors}`)
  lines.push('')

  if (status.ready) {
    lines.push('  ✓ Application is ready to run!')
  } else {
    lines.push('  ✗ Please fix the errors above before running the application.')
  }

  lines.push('')
  lines.push('═══════════════════════════════════════════════════════════')
  lines.push('')

  return lines.join('\n')
}
