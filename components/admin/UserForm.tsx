'use client'

import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'

interface Role {
  id: string
  name: string
}

interface UserFormData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  roleId: string
  smsOptIn: boolean
  smsPreference: 'ALL' | 'CRITICAL_ONLY' | 'NONE'
}

interface UserFormProps {
  initialData?: Partial<UserFormData>
  onSubmit: (data: UserFormData) => Promise<void>
  isLoading?: boolean
  isEdit?: boolean
}

export default function UserForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEdit = false,
}: UserFormProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UserFormData>({
    defaultValues: {
      email: initialData?.email || '',
      password: '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phone: initialData?.phone || '',
      roleId: initialData?.roleId || '',
      smsOptIn: initialData?.smsOptIn || false,
      smsPreference: initialData?.smsPreference || 'CRITICAL_ONLY',
    },
  })

  const smsOptIn = watch('smsOptIn')

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              {...register('firstName', { required: 'First name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              {...register('lastName', { required: 'Last name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {!isEdit && (
            <div className="md:col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                id="password"
                {...register('password', {
                  required: !isEdit ? 'Password is required' : false,
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                  },
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Role Assignment */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Assignment</h3>
        <div>
          <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
            Role *
          </label>
          <select
            id="roleId"
            {...register('roleId', { required: 'Role is required' })}
            disabled={loadingRoles}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.roleId && (
            <p className="mt-1 text-sm text-red-600">{errors.roleId.message}</p>
          )}
        </div>
      </div>

      {/* SMS Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smsOptIn"
              {...register('smsOptIn')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="smsOptIn" className="ml-2 block text-sm text-gray-700">
              Enable SMS notifications
            </label>
          </div>

          {smsOptIn && (
            <div>
              <label htmlFor="smsPreference" className="block text-sm font-medium text-gray-700">
                SMS Preference
              </label>
              <select
                id="smsPreference"
                {...register('smsPreference')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="CRITICAL_ONLY">Critical alerts only</option>
                <option value="ALL">All notifications</option>
                <option value="NONE">None</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  )
}
