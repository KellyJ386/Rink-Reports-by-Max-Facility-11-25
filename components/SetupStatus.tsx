'use client'

import { useState, useEffect } from 'react'

interface CheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  details?: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: CheckResult[]
  summary: {
    total: number
    passed: number
    warnings: number
    errors: number
  }
  error?: string
}

export default function SetupStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch('/api/health?full=true')
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        setHealth({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: [],
          summary: { total: 0, passed: 0, warnings: 0, errors: 0 },
          error: 'Failed to fetch health status',
        })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!health) return null

  const statusColors = {
    healthy: 'bg-green-50 border-green-200',
    degraded: 'bg-amber-50 border-amber-200',
    unhealthy: 'bg-red-50 border-red-200',
  }

  const statusTextColors = {
    healthy: 'text-green-800',
    degraded: 'text-amber-800',
    unhealthy: 'text-red-800',
  }

  const statusIcons = {
    healthy: '✓',
    degraded: '!',
    unhealthy: '✗',
  }

  const checkStatusColors = {
    ok: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  }

  // Group checks by category
  const groupedChecks = {
    'Environment': health.checks.filter((c) => c.name.startsWith('ENV:')),
    'Files': health.checks.filter((c) => c.name.startsWith('File:') || c.name === 'PWA Icons'),
    'Routes': health.checks.filter((c) => c.name.startsWith('Route:')),
    'Database': health.checks.filter((c) => c.name.startsWith('Database')),
  }

  return (
    <div className={`card ${statusColors[health.status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${statusTextColors[health.status]}`}>
            {statusIcons[health.status]}
          </span>
          <h2 className={`text-lg font-bold ${statusTextColors[health.status]}`}>
            System Status: {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          </h2>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="flex gap-4 text-sm mb-2">
        <span className="text-green-700">Passed: {health.summary.passed}</span>
        <span className="text-amber-700">Warnings: {health.summary.warnings}</span>
        <span className="text-red-700">Errors: {health.summary.errors}</span>
      </div>

      {health.error && (
        <p className="text-red-600 text-sm">{health.error}</p>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          {Object.entries(groupedChecks).map(([category, checks]) => {
            if (checks.length === 0) return null
            return (
              <div key={category}>
                <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
                <div className="space-y-1">
                  {checks.map((check, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className={`${checkStatusColors[check.status]} font-bold`}>
                        {check.status === 'ok' ? '✓' : check.status === 'warning' ? '!' : '✗'}
                      </span>
                      <div>
                        <span className="text-gray-700">
                          {check.name.replace(/^(ENV|File|Route): /, '')}: {check.message}
                        </span>
                        {check.details && check.status !== 'ok' && (
                          <p className="text-gray-500 text-xs ml-4">{check.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {health.status !== 'healthy' && (
            <div className="mt-4 p-3 bg-white rounded border">
              <h3 className="font-semibold text-gray-700 mb-2">Quick Fix Commands</h3>
              <code className="text-xs text-gray-600 block space-y-1">
                <div>1. cp .env.example .env</div>
                <div>2. npm install</div>
                <div>3. npm run prisma:generate</div>
                <div>4. npm run prisma:migrate</div>
                <div>5. npm run prisma:seed</div>
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
