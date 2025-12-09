'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DashboardHeaderProps {
  user: {
    id: string
    firstName: string
    lastName: string
    role: { name: string }
    facility: { name: string }
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-navy text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-action rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">MFO</h1>
              <p className="text-xs text-grey-300">{user.facility.name}</p>
            </div>
          </Link>

          {/* User Info & Logout */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-grey-300">{user.role.name}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-navy-600 hover:bg-navy-700 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
