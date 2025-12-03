'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserForm from '@/components/admin/UserForm'

export default function NewUserPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: {
    email: string
    password?: string
    firstName: string
    lastName: string
    phone?: string
    roleId: string
    smsOptIn: boolean
    smsPreference: 'ALL' | 'CRITICAL_ONLY' | 'NONE'
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      router.push('/dashboard/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add a new user to the system
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <UserForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
