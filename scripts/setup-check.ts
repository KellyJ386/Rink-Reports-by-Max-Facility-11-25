#!/usr/bin/env tsx
/**
 * Setup Check Script
 *
 * Run this script to verify your development environment is properly configured.
 *
 * Usage: npm run setup:check
 */

import { existsSync, copyFileSync } from 'fs'
import { join } from 'path'

const basePath = process.cwd()

interface CheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  action?: string
}

const results: CheckResult[] = []

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string) {
  console.log(message)
}

function logHeader(message: string) {
  log(`\n${colors.bold}${colors.cyan}${message}${colors.reset}`)
  log('─'.repeat(60))
}

function logResult(result: CheckResult) {
  const statusIcon = result.status === 'ok' ? '✓' : result.status === 'warning' ? '!' : '✗'
  const statusColor =
    result.status === 'ok' ? colors.green : result.status === 'warning' ? colors.yellow : colors.red

  log(`  ${statusColor}${statusIcon}${colors.reset} ${result.name}: ${result.message}`)
  if (result.action) {
    log(`    ${colors.blue}→ ${result.action}${colors.reset}`)
  }
}

// Check 1: Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10)

  if (majorVersion >= 18) {
    results.push({
      name: 'Node.js version',
      status: 'ok',
      message: nodeVersion,
    })
  } else {
    results.push({
      name: 'Node.js version',
      status: 'error',
      message: `${nodeVersion} (requires >= 18)`,
      action: 'Upgrade Node.js to version 18 or higher',
    })
  }
}

// Check 2: Environment file
function checkEnvFile() {
  const envPath = join(basePath, '.env')
  const envExamplePath = join(basePath, '.env.example')

  if (existsSync(envPath)) {
    results.push({
      name: '.env file',
      status: 'ok',
      message: 'Found',
    })
  } else if (existsSync(envExamplePath)) {
    results.push({
      name: '.env file',
      status: 'error',
      message: 'Missing',
      action: 'Run: cp .env.example .env (then configure values)',
    })
  } else {
    results.push({
      name: '.env file',
      status: 'error',
      message: 'Missing (no .env.example found)',
      action: 'Create .env file with required environment variables',
    })
  }
}

// Check 3: Dependencies installed
function checkDependencies() {
  const nodeModulesPath = join(basePath, 'node_modules')
  const prismaClientPath = join(nodeModulesPath, '@prisma', 'client')

  if (!existsSync(nodeModulesPath)) {
    results.push({
      name: 'Dependencies',
      status: 'error',
      message: 'node_modules not found',
      action: 'Run: npm install',
    })
  } else if (!existsSync(prismaClientPath)) {
    results.push({
      name: 'Dependencies',
      status: 'warning',
      message: '@prisma/client not found',
      action: 'Run: npm install && npm run prisma:generate',
    })
  } else {
    results.push({
      name: 'Dependencies',
      status: 'ok',
      message: 'Installed',
    })
  }
}

// Check 4: Prisma client generated
function checkPrismaClient() {
  const prismaClientPath = join(basePath, 'node_modules', '.prisma', 'client')

  if (existsSync(prismaClientPath)) {
    results.push({
      name: 'Prisma Client',
      status: 'ok',
      message: 'Generated',
    })
  } else {
    results.push({
      name: 'Prisma Client',
      status: 'warning',
      message: 'Not generated',
      action: 'Run: npm run prisma:generate',
    })
  }
}

// Check 5: Dashboard routes exist
function checkDashboardRoutes() {
  const dashboardPath = join(basePath, 'app', 'dashboard')
  const expectedRoutes = [
    'ice-depth',
    'ice-operations',
    'refrigeration',
    'air-quality',
    'incidents',
    'schedule',
    'checklists',
    'admin',
  ]

  let found = 0
  const missing: string[] = []

  for (const route of expectedRoutes) {
    const routePath = join(dashboardPath, route, 'page.tsx')
    if (existsSync(routePath)) {
      found++
    } else {
      missing.push(route)
    }
  }

  if (found === expectedRoutes.length) {
    results.push({
      name: 'Dashboard routes',
      status: 'ok',
      message: `All ${found} routes configured`,
    })
  } else if (found > 0) {
    results.push({
      name: 'Dashboard routes',
      status: 'warning',
      message: `${found}/${expectedRoutes.length} routes found`,
      action: `Missing: ${missing.join(', ')}`,
    })
  } else {
    results.push({
      name: 'Dashboard routes',
      status: 'error',
      message: 'No routes found',
      action: 'Dashboard module pages need to be created',
    })
  }
}

// Check 6: Required files
function checkRequiredFiles() {
  const requiredFiles = [
    { path: 'prisma/schema.prisma', name: 'Prisma Schema' },
    { path: 'app/layout.tsx', name: 'Root Layout' },
    { path: 'app/page.tsx', name: 'Root Page' },
    { path: 'middleware.ts', name: 'Auth Middleware' },
  ]

  for (const file of requiredFiles) {
    const filePath = join(basePath, file.path)
    if (existsSync(filePath)) {
      results.push({
        name: file.name,
        status: 'ok',
        message: 'Found',
      })
    } else {
      results.push({
        name: file.name,
        status: 'error',
        message: `Missing: ${file.path}`,
      })
    }
  }
}

// Run all checks
function runChecks() {
  log(`\n${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}`)
  log(`${colors.bold}  MFO Ice Rink SaaS - Setup Check${colors.reset}`)
  log(`${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}`)

  logHeader('Environment')
  checkNodeVersion()
  checkEnvFile()
  results.slice(-2).forEach(logResult)

  logHeader('Dependencies')
  checkDependencies()
  checkPrismaClient()
  results.slice(-2).forEach(logResult)

  logHeader('Application Structure')
  checkRequiredFiles()
  results.slice(-4).forEach(logResult)

  logHeader('Dashboard Modules')
  checkDashboardRoutes()
  results.slice(-1).forEach(logResult)

  // Summary
  const errors = results.filter((r) => r.status === 'error').length
  const warnings = results.filter((r) => r.status === 'warning').length
  const passed = results.filter((r) => r.status === 'ok').length

  logHeader('Summary')
  log(`  Total checks: ${results.length}`)
  log(`  ${colors.green}Passed: ${passed}${colors.reset}`)
  log(`  ${colors.yellow}Warnings: ${warnings}${colors.reset}`)
  log(`  ${colors.red}Errors: ${errors}${colors.reset}`)

  log('')
  if (errors > 0) {
    log(`${colors.red}${colors.bold}✗ Setup incomplete - please fix the errors above${colors.reset}`)
    log('')
    log(`${colors.cyan}Quick setup commands:${colors.reset}`)
    log('  1. cp .env.example .env')
    log('  2. npm install')
    log('  3. npm run prisma:generate')
    log('  4. npm run prisma:migrate')
    log('  5. npm run prisma:seed')
    log('  6. npm run dev')
    process.exit(1)
  } else if (warnings > 0) {
    log(`${colors.yellow}${colors.bold}! Setup has warnings - app may work with limited functionality${colors.reset}`)
    process.exit(0)
  } else {
    log(`${colors.green}${colors.bold}✓ Setup complete - ready to run!${colors.reset}`)
    log('')
    log(`Start the development server with: ${colors.cyan}npm run dev${colors.reset}`)
    process.exit(0)
  }
}

runChecks()
