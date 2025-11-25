'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-wolf-100">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-action">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-navy rounded-full mb-4">
              <span className="text-2xl font-bold text-white">MFO</span>
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">
              Max Facility Operations
            </h1>
            <p className="text-wolf-600">Ice Rink Management Platform</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" required>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-wolf-200">
            <p className="text-sm text-center text-wolf-600 mb-3">
              Demo Accounts
            </p>
            <div className="bg-wolf-50 rounded-lg p-4 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium text-navy">General Manager:</div>
                <div className="text-wolf-700">gm@demo.com</div>

                <div className="font-medium text-navy">Facility Manager:</div>
                <div className="text-wolf-700">manager@demo.com</div>

                <div className="font-medium text-navy">Supervisor:</div>
                <div className="text-wolf-700">supervisor@demo.com</div>

                <div className="font-medium text-navy">Operator:</div>
                <div className="text-wolf-700">operator@demo.com</div>
              </div>
              <div className="text-center pt-2 border-t border-wolf-200">
                <span className="text-wolf-600">Password: </span>
                <code className="bg-white px-2 py-1 rounded text-navy font-semibold">
                  password123
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-wolf-500 text-sm mt-6">
          © 2025 Max Facility Operations. All rights reserved.
        </p>
      </div>
    </div>
  )
}
