'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import PermissionMatrix from '@/components/admin/PermissionMatrix'
import Badge from '@/components/ui/Badge'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PermissionSet = any

interface Role {
  id: string
  name: string
  description: string | null
  isSystemDefault: boolean
  permissions: PermissionSet
  userCount: number
}

interface FormData {
  name: string
  description: string
}

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<PermissionSet>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  useEffect(() => {
    fetchRole()
  }, [id])

  const fetchRole = async () => {
    try {
      const response = await fetch(`/api/admin/roles/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch role')
      }
      const data = await response.json()
      setRole(data)
      setPermissions(data.permissions)
      reset({
        name: data.name,
        description: data.description || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (role?.isSystemDefault) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          permissions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      router.push('/dashboard/admin/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Role not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {role.isSystemDefault ? 'View' : 'Edit'} Role: {role.name}
            </h2>
            {role.isSystemDefault && (
              <Badge variant="info">System Default</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned to this role
          </p>
        </div>
      </div>

      {role.isSystemDefault && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> System default roles cannot be modified. You can view the permissions below or create a custom role based on these settings.
          </p>
        </div>
      )}

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
                disabled={role.isSystemDefault}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
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
                disabled={role.isSystemDefault}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
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
            readOnly={role.isSystemDefault}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {role.isSystemDefault ? 'Back' : 'Cancel'}
          </button>
          {!role.isSystemDefault && (
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
