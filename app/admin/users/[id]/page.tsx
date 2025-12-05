'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  Clock,
  Activity,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Key,
  History,
  Settings,
  MoreVertical,
  Send,
  UserCog,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  User as UserType,
  UserWithDetails,
  UserStatus,
  Role,
  PermissionKey,
  PermissionCategory,
  PERMISSIONS,
  SYSTEM_ROLES,
  AuditLog,
} from '@/types/admin'

// Status configuration
const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-800', icon: Ban },
  LOCKED: { label: 'Locked', color: 'bg-orange-100 text-orange-800', icon: Lock },
}

// Mock facility data
const mockFacility = {
  id: 'facility-1',
  name: 'Main Arena',
  slug: 'main-arena',
  address: '123 Ice Way',
  city: 'Frostburg',
  state: 'MN',
  zipCode: '55001',
  country: 'USA',
  phone: '+1 (555) 000-0000',
  email: 'info@mainarena.com',
  timezone: 'America/Chicago',
  isActive: true,
  status: 'active',
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// Mock data for demo
const getMockUser = (id: string): UserWithDetails => ({
  id,
  email: 'john.smith@icerink.com',
  firstName: 'John',
  lastName: 'Smith',
  phone: '+1 (555) 123-4567',
  avatar: undefined,
  status: 'ACTIVE',
  emailVerified: true,
  phoneVerified: true,
  roleId: 'role-3',
  facilityIds: ['facility-1'],
  facilityId: 'facility-1',
  jobTitle: 'Senior Ice Technician',
  department: 'Maintenance',
  employeeId: 'EMP-2024-001',
  hireDate: '2022-03-15',
  failedLoginAttempts: 0,
  requirePasswordChange: false,
  twoFactorEnabled: false,
  permissions: ['USERS:VIEW', 'SCHEDULES:VIEW', 'SCHEDULES:EDIT', 'INCIDENTS:VIEW', 'INCIDENTS:CREATE'],
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      push: true,
      sms: false,
      scheduleChanges: true,
      incidentAlerts: true,
      systemUpdates: false,
    },
    dashboardLayout: 'default',
  },
  createdAt: '2022-03-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  lastLoginAt: '2024-01-25T08:15:00Z',
  role: {
    id: 'role-3',
    name: 'Ice Technician',
    slug: 'ice-technician',
    description: 'Ice maintenance staff',
    type: 'SYSTEM',
    permissions: ['SCHEDULES:VIEW', 'SCHEDULES:EDIT', 'INCIDENTS:VIEW', 'INCIDENTS:CREATE', 'MAINTENANCE:VIEW', 'MAINTENANCE:EDIT'],
    isDefault: true,
    color: '#0ea5e9',
    icon: 'wrench',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  facilities: [mockFacility],
  facility: mockFacility,
  effectivePermissions: ['USERS:VIEW', 'SCHEDULES:VIEW', 'SCHEDULES:EDIT', 'INCIDENTS:VIEW', 'INCIDENTS:CREATE'],
})

// Mock roles
const mockRoles: Role[] = SYSTEM_ROLES.map((role, index) => ({
  ...role,
  id: `role-${index + 1}`,
  createdAt: '2022-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
})) as Role[]

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2024-01-25T08:15:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'LOGIN',
    resource: 'session',
    resourceId: 'session-123',
    details: { ip: '192.168.1.100', browser: 'Chrome' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    severity: 'INFO',
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    timestamp: '2024-01-24T16:30:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'UPDATE',
    resource: 'schedule',
    resourceId: 'schedule-456',
    details: { changes: { shift: 'Morning to Evening' } },
    changes: { before: { shift: 'Morning' }, after: { shift: 'Evening' } },
    severity: 'INFO',
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    timestamp: '2024-01-23T10:00:00Z',
    userId: 'user-1',
    userName: 'John Smith',
    action: 'CREATE',
    resource: 'incident',
    resourceId: 'incident-789',
    details: { type: 'Equipment Malfunction' },
    severity: 'WARNING',
    status: 'SUCCESS',
  },
]

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [user, setUser] = useState<UserWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<Partial<UserWithDetails>>({})
  const [activeTab, setActiveTab] = useState('profile')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<UserStatus>('ACTIVE')
  const [statusReason, setStatusReason] = useState('')
  const [permissionOverrides, setPermissionOverrides] = useState<PermissionKey[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setUser(getMockUser(id))
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [id])

  useEffect(() => {
    if (user) {
      setEditedUser(user)
      setPermissionOverrides(user.permissions || [])
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (user) {
      setUser({ ...user, ...editedUser, permissions: permissionOverrides })
    }
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleStatusChange = async () => {
    if (!user) return
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setUser({ ...user, status: newStatus })
    setShowStatusDialog(false)
    setStatusReason('')
  }

  const handleResetPassword = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setShowResetPasswordDialog(false)
    // Show success message
  }

  const togglePermission = (permission: PermissionKey) => {
    setPermissionOverrides((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return 'text-red-600'
      case 'WARNING':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <User className="h-16 w-16 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">User not found</h2>
        <p className="text-gray-600">The user you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>
    )
  }

  const StatusIcon = STATUS_CONFIG[user.status].icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <Badge className={STATUS_CONFIG[user.status].color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {STATUS_CONFIG[user.status].label}
                </Badge>
              </div>
              <p className="text-gray-600">{user.email}</p>
              {user.jobTitle && <p className="text-sm text-gray-500">{user.jobTitle}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowResetPasswordDialog(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setNewStatus(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                    setShowStatusDialog(true)
                  }}>
                    {user.status === 'ACTIVE' ? (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend User
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate User
                      </>
                    )}
                  </DropdownMenuItem>
                  {user.status === 'LOCKED' && (
                    <DropdownMenuItem onClick={() => {
                      setNewStatus('ACTIVE')
                      setShowStatusDialog(true)
                    }}>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Account
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic user details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={editedUser.firstName || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{user.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={editedUser.lastName || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{user.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedUser.email || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editedUser.phone || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    {isEditing ? (
                      <Input
                        id="jobTitle"
                        value={editedUser.jobTitle || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, jobTitle: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{user.jobTitle || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={editedUser.department || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900">{user.department || 'Not specified'}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  {isEditing ? (
                    <Input
                      id="employeeId"
                      value={editedUser.employeeId || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, employeeId: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900">{user.employeeId || 'Not assigned'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Role & Facility */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role & Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    {isEditing ? (
                      <Select
                        value={editedUser.roleId}
                        onValueChange={(value) => setEditedUser({ ...editedUser, roleId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Badge
                          style={{ backgroundColor: user.role?.color }}
                          className="text-white"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role?.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Facility</Label>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{user.facility?.name || 'Not assigned'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge className={STATUS_CONFIG[user.status].color}>
                      {STATUS_CONFIG[user.status].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hire Date</span>
                    <span>{user.hireDate ? new Date(user.hireDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Login</span>
                    <span>{formatDate(user.lastLoginAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span>{formatDate(user.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>
                Role-based permissions plus individual overrides.
                {user.role && (
                  <span className="ml-1">
                    Base permissions from <strong>{user.role.name}</strong> role.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(Object.keys(PERMISSIONS) as PermissionCategory[]).map((category) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-600" />
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PERMISSIONS[category].map((permission) => {
                        const permKey = `${permission.resource}:${permission.action}` as PermissionKey
                        const hasFromRole = user.role?.permissions.includes(permKey)
                        const hasOverride = permissionOverrides.includes(permKey)
                        const isActive = hasFromRole || hasOverride

                        return (
                          <div
                            key={permKey}
                            className={`p-3 rounded-lg border ${
                              isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">
                                    {permission.name}
                                  </span>
                                  {hasFromRole && (
                                    <Badge variant="outline" className="text-xs">
                                      Role
                                    </Badge>
                                  )}
                                  {hasOverride && !hasFromRole && (
                                    <Badge variant="outline" className="text-xs bg-blue-50">
                                      Override
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {permission.description}
                                </p>
                              </div>
                              {isEditing && (
                                <Switch
                                  checked={hasOverride}
                                  onCheckedChange={() => togglePermission(permKey)}
                                  disabled={hasFromRole}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User&apos;s recent actions and login history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200"
                  >
                    <div className={`p-2 rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Activity className={`h-4 w-4 ${
                        log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{log.action}</span>
                          <span className="text-gray-500 ml-2">on {log.resource}</span>
                          {log.resourceId && (
                            <span className="text-gray-400 ml-1">#{log.resourceId}</span>
                          )}
                        </div>
                        <Badge variant="outline" className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      {log.changes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Changed: {JSON.stringify(log.changes)}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(log.timestamp)}
                        </span>
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href={`/admin/audit-logs?userId=${user.id}`}>
                    <History className="h-4 w-4 mr-2" />
                    View Full Activity Log
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>Personal settings and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    disabled={!isEditing}
                    value={editedUser.preferences?.theme || 'system'}
                    onValueChange={(value) =>
                      setEditedUser({
                        ...editedUser,
                        preferences: { ...editedUser.preferences!, theme: value as 'light' | 'dark' | 'system' },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    disabled={!isEditing}
                    value={editedUser.preferences?.language || 'en'}
                    onValueChange={(value) =>
                      setEditedUser({
                        ...editedUser,
                        preferences: { ...editedUser.preferences!, language: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    disabled={!isEditing}
                    value={editedUser.preferences?.timezone || 'America/New_York'}
                    onValueChange={(value) =>
                      setEditedUser({
                        ...editedUser,
                        preferences: { ...editedUser.preferences!, timezone: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notification Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'email', label: 'Email Notifications' },
                    { key: 'push', label: 'Push Notifications' },
                    { key: 'sms', label: 'SMS Notifications' },
                    { key: 'scheduleChanges', label: 'Schedule Changes' },
                    { key: 'incidentAlerts', label: 'Incident Alerts' },
                    { key: 'systemUpdates', label: 'System Updates' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <span>{label}</span>
                      <Switch
                        disabled={!isEditing}
                        checked={
                          editedUser.preferences?.notifications?.[
                            key as keyof typeof editedUser.preferences.notifications
                          ] ?? false
                        }
                        onCheckedChange={(checked) =>
                          setEditedUser({
                            ...editedUser,
                            preferences: {
                              ...editedUser.preferences!,
                              notifications: {
                                ...editedUser.preferences!.notifications,
                                [key]: checked,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Status</DialogTitle>
            <DialogDescription>
              Change the status of {user.firstName} {user.lastName} to{' '}
              <strong>{STATUS_CONFIG[newStatus].label}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter reason for status change..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset link to {user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              A password reset email will be sent to the user. The link will expire in 24 hours.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              <Send className="h-4 w-4 mr-2" />
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.firstName} {user.lastName}? This action cannot
              be undone. All user data, including activity logs and permissions, will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
