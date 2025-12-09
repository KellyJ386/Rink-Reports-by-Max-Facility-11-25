'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Copy,
  Users,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Save,
  MoreVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Role,
  RoleType,
  Permission,
  PermissionKey,
  PermissionCategory,
  PERMISSIONS,
  ALL_PERMISSIONS,
  SYSTEM_ROLES,
} from '@/types/admin'

// Generate mock roles from system roles
const generateMockRoles = (): Role[] => {
  const baseCounts: Record<string, number> = {
    'super-admin': 2,
    'facility-manager': 3,
    'supervisor': 5,
    'ice-technician': 12,
    'front-desk': 8,
    'viewer': 4,
  }

  return SYSTEM_ROLES.map((role, index) => ({
    ...role,
    id: `role-${index + 1}`,
    userCount: baseCounts[role.slug] || 0,
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })) as Role[]
}

// Permission category icons
const CATEGORY_ICONS: Record<PermissionCategory, React.ReactNode> = {
  USER_MANAGEMENT: <Users className="h-4 w-4" />,
  FACILITY_MANAGEMENT: <Settings className="h-4 w-4" />,
  SCHEDULE_MANAGEMENT: <Shield className="h-4 w-4" />,
  REPORT_MANAGEMENT: <Eye className="h-4 w-4" />,
  SYSTEM_ADMINISTRATION: <Lock className="h-4 w-4" />,
}

// Role type colors
const ROLE_TYPE_CONFIG: Record<RoleType, { label: string; color: string }> = {
  SYSTEM: { label: 'System', color: 'bg-purple-100 text-purple-800' },
  CUSTOM: { label: 'Custom', color: 'bg-blue-100 text-blue-800' },
  TEMPORARY: { label: 'Temporary', color: 'bg-yellow-100 text-yellow-800' },
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(generateMockRoles())
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(PERMISSIONS))
  )
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<RoleType | 'all'>('all')

  // Create/Edit form state
  const [formData, setFormData] = useState<{
    name: string
    slug: string
    description: string
    type: RoleType
    permissions: PermissionKey[]
    color: string
    icon: string
    isDefault: boolean
  }>({
    name: '',
    slug: '',
    description: '',
    type: 'CUSTOM',
    permissions: [],
    color: '#3b82f6',
    icon: 'shield',
    isDefault: false,
  })

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || role.type === filterType
    return matchesSearch && matchesType
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const togglePermission = (permission: PermissionKey) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleCategoryPermissions = (category: PermissionCategory, enabled: boolean) => {
    const categoryPermissions = PERMISSIONS[category].map(
      (p) => `${p.resource}:${p.action}` as PermissionKey
    )

    setFormData((prev) => ({
      ...prev,
      permissions: enabled
        ? [...new Set([...prev.permissions, ...categoryPermissions])]
        : prev.permissions.filter((p) => !categoryPermissions.includes(p)),
    }))
  }

  const isCategoryFullyEnabled = (category: PermissionCategory): boolean => {
    return PERMISSIONS[category].every((p) =>
      formData.permissions.includes(`${p.resource}:${p.action}` as PermissionKey)
    )
  }

  const isCategoryPartiallyEnabled = (category: PermissionCategory): boolean => {
    const categoryPermissions = PERMISSIONS[category].map(
      (p) => `${p.resource}:${p.action}` as PermissionKey
    )
    const enabledCount = categoryPermissions.filter((p) =>
      formData.permissions.includes(p)
    ).length
    return enabledCount > 0 && enabledCount < categoryPermissions.length
  }

  const handleCreateRole = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'CUSTOM',
      permissions: [],
      color: '#3b82f6',
      icon: 'shield',
      isDefault: false,
    })
    setShowCreateDialog(true)
  }

  const handleEditRole = (role: Role) => {
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description,
      type: role.type,
      permissions: [...role.permissions],
      color: role.color || '#3b82f6',
      icon: role.icon || 'shield',
      isDefault: role.isDefault,
    })
    setSelectedRole(role)
    setIsEditMode(true)
  }

  const handleDuplicateRole = (role: Role) => {
    setFormData({
      name: `${role.name} (Copy)`,
      slug: `${role.slug}-copy`,
      description: role.description,
      type: 'CUSTOM',
      permissions: [...role.permissions],
      color: role.color || '#3b82f6',
      icon: role.icon || 'shield',
      isDefault: false,
    })
    setShowCreateDialog(true)
  }

  const handleSaveRole = () => {
    if (isEditMode && selectedRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id
            ? { ...r, ...formData, updatedAt: new Date().toISOString() }
            : r
        )
      )
      setIsEditMode(false)
      setSelectedRole(null)
    } else {
      const newRole: Role = {
        ...formData,
        id: `role-${Date.now()}`,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setRoles((prev) => [...prev, newRole])
      setShowCreateDialog(false)
    }
  }

  const handleDeleteRole = () => {
    if (roleToDelete) {
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id))
      setRoleToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const getCategoryPermissionCount = (role: Role, category: PermissionCategory): string => {
    const categoryPermissions = PERMISSIONS[category].map(
      (p) => `${p.resource}:${p.action}` as PermissionKey
    )
    const enabledCount = categoryPermissions.filter((p) =>
      role.permissions.includes(p)
    ).length
    return `${enabledCount}/${categoryPermissions.length}`
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600">
              Manage roles and permissions for your organization
            </p>
          </div>
          <Button onClick={handleCreateRole}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Roles</p>
                  <p className="text-2xl font-bold">{roles.length}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">System Roles</p>
                  <p className="text-2xl font-bold">
                    {roles.filter((r) => r.type === 'SYSTEM').length}
                  </p>
                </div>
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Custom Roles</p>
                  <p className="text-2xl font-bold">
                    {roles.filter((r) => r.type === 'CUSTOM').length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Permissions</p>
                  <p className="text-2xl font-bold">{ALL_PERMISSIONS.length}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as RoleType | 'all')}
            >
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
                <SelectItem value="TEMPORARY">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'matrix')}>
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRole?.id === role.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${role.color}20` }}
                      >
                        <Shield className="h-5 w-5" style={{ color: role.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <Badge className={ROLE_TYPE_CONFIG[role.type].color}>
                          {ROLE_TYPE_CONFIG[role.type].label}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRole(role)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateRole(role)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {role.type !== 'SYSTEM' && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setRoleToDelete(role)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{role.userCount || 0} users</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>{role.permissions.length} permissions</span>
                    </div>
                  </div>
                  {role.isDefault && (
                    <Badge variant="outline" className="mt-2">
                      Default Role
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Matrix View */}
        {viewMode === 'matrix' && (
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Compare permissions across all roles at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-500 min-w-[200px]">
                        Permission
                      </th>
                      {filteredRoles.map((role) => (
                        <th
                          key={role.id}
                          className="text-center p-3 font-medium min-w-[100px]"
                        >
                          <div className="flex flex-col items-center">
                            <Shield
                              className="h-4 w-4 mb-1"
                              style={{ color: role.color }}
                            />
                            <span className="text-xs">{role.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(PERMISSIONS) as PermissionCategory[]).map((category) => (
                      <>
                        <tr
                          key={category}
                          className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleCategory(category)}
                        >
                          <td className="p-3 font-medium" colSpan={filteredRoles.length + 1}>
                            <div className="flex items-center space-x-2">
                              {expandedCategories.has(category) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {CATEGORY_ICONS[category]}
                              <span>{category.replace(/_/g, ' ')}</span>
                              <Badge variant="outline" className="ml-2">
                                {PERMISSIONS[category].length}
                              </Badge>
                            </div>
                          </td>
                        </tr>
                        {expandedCategories.has(category) &&
                          PERMISSIONS[category].map((permission) => {
                            const permKey = `${permission.resource}:${permission.action}` as PermissionKey
                            return (
                              <tr key={permKey} className="border-b hover:bg-gray-50">
                                <td className="p-3 pl-10">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm">{permission.name}</span>
                                        <Info className="h-3 w-3 text-gray-400" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{permission.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </td>
                                {filteredRoles.map((role) => {
                                  const hasPermission = role.permissions.includes(permKey)
                                  return (
                                    <td key={role.id} className="text-center p-3">
                                      {hasPermission ? (
                                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                                      ) : (
                                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Role Detail Panel */}
        {selectedRole && !isEditMode && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${selectedRole.color}20` }}
                  >
                    <Shield className="h-6 w-6" style={{ color: selectedRole.color }} />
                  </div>
                  <div>
                    <CardTitle>{selectedRole.name}</CardTitle>
                    <CardDescription>{selectedRole.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => handleEditRole(selectedRole)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedRole(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{selectedRole.userCount || 0}</p>
                    <p className="text-sm text-gray-500">Users with this role</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{selectedRole.permissions.length}</p>
                    <p className="text-sm text-gray-500">Permissions granted</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {Math.round(
                        (selectedRole.permissions.length / ALL_PERMISSIONS.length) * 100
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500">Permission coverage</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Permissions by Category</h4>
                  {(Object.keys(PERMISSIONS) as PermissionCategory[]).map((category) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {CATEGORY_ICONS[category]}
                          <span className="font-medium">
                            {category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {getCategoryPermissionCount(selectedRole, category)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PERMISSIONS[category].map((permission) => {
                          const permKey = `${permission.resource}:${permission.action}` as PermissionKey
                          const hasPermission = selectedRole.permissions.includes(permKey)
                          return (
                            <Badge
                              key={permKey}
                              variant={hasPermission ? 'default' : 'outline'}
                              className={
                                hasPermission ? 'bg-green-100 text-green-800' : 'text-gray-400'
                              }
                            >
                              {hasPermission ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              {permission.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Role Panel */}
        {isEditMode && selectedRole && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Edit Role: {selectedRole.name}</CardTitle>
                  <CardDescription>
                    Modify role settings and permissions
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditMode(false)
                    setSelectedRole(null)
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRole}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Role Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            name: e.target.value,
                            slug: generateSlug(e.target.value),
                          })
                        }}
                        disabled={selectedRole.type === 'SYSTEM'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        disabled={selectedRole.type === 'SYSTEM'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          id="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value as RoleType })}
                        disabled={selectedRole.type === 'SYSTEM'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SYSTEM">System</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                          <SelectItem value="TEMPORARY">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                    />
                    <Label>Set as default role for new users</Label>
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                      {formData.permissions.length} of {ALL_PERMISSIONS.length} permissions selected
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, permissions: [] })}
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            permissions: ALL_PERMISSIONS.map(
                              (p) => `${p.resource}:${p.action}` as PermissionKey
                            ),
                          })
                        }
                      >
                        Select All
                      </Button>
                    </div>
                  </div>

                  {(Object.keys(PERMISSIONS) as PermissionCategory[]).map((category) => (
                    <div key={category} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isCategoryFullyEnabled(category)}
                            onCheckedChange={(checked) =>
                              toggleCategoryPermissions(category, checked as boolean)
                            }
                            className={
                              isCategoryPartiallyEnabled(category)
                                ? 'data-[state=checked]:bg-blue-300'
                                : ''
                            }
                          />
                          {CATEGORY_ICONS[category]}
                          <span className="font-medium">{category.replace(/_/g, ' ')}</span>
                          <Badge variant="outline">
                            {PERMISSIONS[category].filter((p) =>
                              formData.permissions.includes(
                                `${p.resource}:${p.action}` as PermissionKey
                              )
                            ).length}
                            /{PERMISSIONS[category].length}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
                        {PERMISSIONS[category].map((permission) => {
                          const permKey = `${permission.resource}:${permission.action}` as PermissionKey
                          return (
                            <div
                              key={permKey}
                              className={`flex items-start space-x-2 p-2 rounded ${
                                formData.permissions.includes(permKey)
                                  ? 'bg-green-50'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <Checkbox
                                checked={formData.permissions.includes(permKey)}
                                onCheckedChange={() => togglePermission(permKey)}
                              />
                              <div>
                                <p className="text-sm font-medium">{permission.name}</p>
                                <p className="text-xs text-gray-500">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Create Role Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="permissions">
                  Permissions ({formData.permissions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Role Name *</Label>
                    <Input
                      id="new-name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        })
                      }}
                      placeholder="e.g., Shift Supervisor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-slug">Slug</Label>
                    <Input
                      id="new-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Textarea
                    id="new-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this role is for..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as RoleType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                        <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                  <Label>Set as default role for new users</Label>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    {formData.permissions.length} of {ALL_PERMISSIONS.length} permissions selected
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, permissions: [] })}
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          permissions: ALL_PERMISSIONS.map(
                            (p) => `${p.resource}:${p.action}` as PermissionKey
                          ),
                        })
                      }
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                {(Object.keys(PERMISSIONS) as PermissionCategory[]).map((category) => (
                  <div key={category} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isCategoryFullyEnabled(category)}
                        onCheckedChange={(checked) =>
                          toggleCategoryPermissions(category, checked as boolean)
                        }
                      />
                      {CATEGORY_ICONS[category]}
                      <span className="font-medium">{category.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                      {PERMISSIONS[category].map((permission) => {
                        const permKey = `${permission.resource}:${permission.action}` as PermissionKey
                        return (
                          <div
                            key={permKey}
                            className="flex items-start space-x-2 p-2 rounded bg-gray-50"
                          >
                            <Checkbox
                              checked={formData.permissions.includes(permKey)}
                              onCheckedChange={() => togglePermission(permKey)}
                            />
                            <div>
                              <p className="text-sm font-medium">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole} disabled={!formData.name}>
                <Save className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the &quot;{roleToDelete?.name}&quot; role?
                {roleToDelete?.userCount && roleToDelete.userCount > 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <span className="text-yellow-800">
                      This role is assigned to {roleToDelete.userCount} users. They will need
                      to be reassigned to a different role.
                    </span>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteRole}
              >
                Delete Role
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
