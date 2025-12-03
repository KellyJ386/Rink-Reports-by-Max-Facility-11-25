'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DataTable, { Column } from '@/components/ui/DataTable'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  role: {
    id: string
    name: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([])
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) params.set('search', search)
      if (roleFilter) params.set('roleId', roleFilter)
      if (statusFilter) params.set('isActive', statusFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleSearch = (query: string) => {
    setSearch(query)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleDelete = async () => {
    if (!deleteUser) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setIsDeleting(false)
      setDeleteUser(null)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role.name',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <Badge variant="info">{user.role.name}</Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'error'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (user) =>
        user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Never',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/admin/users/${user.id}`)
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeleteUser(user)
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            {user.isActive ? 'Deactivate' : 'Delete'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              onSearch={handleSearch}
              placeholder="Search by name or email..."
            />
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(user) => user.id}
        onRowClick={(user) => router.push(`/dashboard/admin/users/${user.id}`)}
        isLoading={isLoading}
        emptyMessage="No users found"
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          itemsPerPage: pagination.limit,
          onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title={deleteUser?.isActive ? 'Deactivate User' : 'Delete User'}
        message={`Are you sure you want to ${
          deleteUser?.isActive ? 'deactivate' : 'delete'
        } ${deleteUser?.firstName} ${deleteUser?.lastName}? ${
          deleteUser?.isActive
            ? 'They will no longer be able to access the system.'
            : 'This action cannot be undone.'
        }`}
        confirmText={deleteUser?.isActive ? 'Deactivate' : 'Delete'}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
