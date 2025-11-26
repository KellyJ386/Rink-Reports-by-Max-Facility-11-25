'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bgError, setBgError] = useState(false)
  const [logoError, setLogoError] = useState(false)

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background - Image with Grayscale or Fallback Gradient */}
      <div className="absolute inset-0 z-0">
        {!bgError ? (
          <Image
            src="/images/rink-background.jpg"
            alt="Ice Rink Background"
            fill
            className="object-cover grayscale opacity-40"
            priority
            onError={() => setBgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
        )}
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-slate-900/60" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {!logoError ? (
              <Image
                src="/images/max-facility-logo.png"
                alt="Max Facility Logo"
                width={280}
                height={140}
                className="h-auto"
                priority
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-3xl font-black text-white bg-[#1e3a5f] px-3 py-1">MAX</span>
                  <span className="text-3xl font-black text-white bg-[#4EB85E] px-3 py-1">FACILITY</span>
                </div>
                <div className="w-48 h-1 bg-gradient-to-r from-[#1e3a5f] to-[#4EB85E] mx-auto rounded" />
              </div>
            )}
          </div>

          {/* Tagline */}
          <p className="text-center text-slate-600 text-sm mb-8">
            Ice Rink Management System
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-900 placeholder-slate-400 bg-white"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-slate-900 placeholder-slate-400 bg-white"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4EB85E] to-[#3d9c4d] hover:from-[#45a854] hover:to-[#358c43] text-white font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-500 mb-3">
              Demo Accounts <span className="text-slate-400">(password: password123)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="bg-slate-50 rounded-md px-3 py-2 text-center">
                <span className="font-medium text-slate-700">GM</span>
                <br />gm@demo.com
              </div>
              <div className="bg-slate-50 rounded-md px-3 py-2 text-center">
                <span className="font-medium text-slate-700">Manager</span>
                <br />manager@demo.com
              </div>
              <div className="bg-slate-50 rounded-md px-3 py-2 text-center">
                <span className="font-medium text-slate-700">Supervisor</span>
                <br />supervisor@demo.com
              </div>
              <div className="bg-slate-50 rounded-md px-3 py-2 text-center">
                <span className="font-medium text-slate-700">Operator</span>
                <br />operator@demo.com
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          &copy; {new Date().getFullYear()} Max Facility. All rights reserved.
        </p>
      </div>
    </div>
  )
}
