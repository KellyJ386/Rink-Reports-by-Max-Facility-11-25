'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import PermissionMatrix from '@/components/admin/PermissionMatrix'

interface FormData {
  name: string
  description: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PermissionSet = any

const DEFAULT_PERMISSIONS: PermissionSet = {
  admin: { access: false, editUsers: false, editForms: false, editSettings: false },
  iceDepth: { access: false, submit: false, viewOwn: false, viewAll: false, edit: false, delete: false, export: false },
  iceOperations: { access: false, submit: false, viewOwn: false, viewAll: false, edit: false, delete: false, export: false },
  refrigeration: { access: false, submit: false, viewOwn: false, viewAll: false, edit: false, delete: false, export: false },
  airQuality: { access: false, submit: false, viewOwn: false, viewAll: false, edit: false, delete: false, export: false },
  incidents: { access: false, submit: false, viewOwn: false, viewAll: false, edit: false, delete: false, export: false, approve: false },
  schedule: { access: false, viewOwn: false, viewAll: false, create: false, edit: false, delete: false, publish: false },
  dailyChecklist: { access: false, submit: false, viewOwn: false, viewAll: false, edit: false, delete: false, export: false, createTemplates: false },
}

export default function NewRolePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          permissions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create role')
      }

      router.push('/dashboard/admin/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Create New Role</h2>
        <p className="text-sm text-gray-500 mt-1">
          Define a new permission template for users
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Role Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Role Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { required: 'Role name is required' })}
                placeholder="e.g., Shift Supervisor"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={2}
                placeholder="Brief description of this role's responsibilities"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
          <PermissionMatrix
            permissions={permissions}
            onChange={setPermissions}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  )
}
