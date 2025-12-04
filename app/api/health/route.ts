import { NextResponse } from 'next/server'
import {
  runAllChecks,
  checkEnvironmentVariables,
  checkDashboardRoutes,
  checkDatabaseConnection,
  checkDatabaseSeeded,
  type SetupStatus,
} from '@/lib/setup-check'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * Returns the health status of the application including:
 * - Environment configuration
 * - Database connectivity
 * - Route availability
 *
 * Query params:
 * - full=true: Run all checks (slower, includes file system checks)
 * - quick=true: Quick database-only check (default)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fullCheck = searchParams.get('full') === 'true'

  try {
    if (fullCheck) {
      // Run comprehensive checks
      const status = await runAllChecks()

      return NextResponse.json({
        status: status.ready ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks: status.checks,
        summary: status.summary,
      })
    }

    // Quick health check - just database and critical env vars
    const checks: SetupStatus['checks'] = []

    // Check critical environment variables
    const envChecks = checkEnvironmentVariables()
    const criticalEnvVars = envChecks.filter(
      (c) => c.name.includes('DATABASE_URL') || c.name.includes('JWT_SECRET')
    )
    checks.push(...criticalEnvVars)

    // Check database connection
    const dbCheck = await checkDatabaseConnection()
    checks.push(dbCheck)

    // Check if seeded (only if connected)
    if (dbCheck.status === 'ok') {
      const seedCheck = await checkDatabaseSeeded()
      checks.push(seedCheck)
    }

    const errors = checks.filter((c) => c.status === 'error').length
    const warnings = checks.filter((c) => c.status === 'warning').length

    return NextResponse.json({
      status: errors > 0 ? 'unhealthy' : warnings > 0 ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter((c) => c.status === 'ok').length,
        warnings,
        errors,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
